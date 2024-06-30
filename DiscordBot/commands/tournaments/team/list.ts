import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../";
import { extractParameters } from "../../../functions/parameterFunctions";
import { Team } from "../../../../Models/tournaments/team";
import commandUser from "../../../functions/commandUser";
import respond from "../../../functions/respond";
import getUser from "../../../../Server/functions/get/getUser";
import { loginResponse } from "../../../functions/loginResponse";
import { EmbedBuilder } from "../../../functions/embedBuilder";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();
        
    const params = await extractParameters<parameters>(m, [
        { name: "all", shortName: "a", paramType: "boolean", optional: true },
        { name: "captain", shortName: "c", paramType: "boolean", optional: true },
    ]);
    if (!params)
        return;

    const { all, captain } = params;

    const teamQ = Team
        .createQueryBuilder("team")
        .innerJoinAndSelect("team.captain", "captain")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("team.tournaments", "tournament");

    if (!all) {
        const user = await getUser(commandUser(m).id, "discord", false);
        if (!user) {
            await loginResponse(m);
            return;
        }

        teamQ.where("captain.ID = :userID", { userID: user.ID });
        if (!captain)
            teamQ.orWhere("member.ID = :userID", { userID: user.ID });
    }

    const teams = await teamQ.getMany();
    
    const embed = new EmbedBuilder()
        .setTitle("Teams")
        .setDescription(`Showing ${teams.length} teams`)
        .addFields(teams.map(team => {
            return {
                name: `${team.name} (${team.abbreviation})`,
                value: `Captain: ${team.captain.osu.username} <@${team.captain.discord.userID}> (${team.captain.osu.userID})\nMembers: ${team.members.map(member => `${member.osu.username} <@${member.discord.userID}> (${member.osu.userID})`).join(", ")}\nTournaments: ${team.tournaments.map(tournament => `${tournament.name} (${tournament.abbreviation})`).join(", ")}`,
            };
        }));

    await respond(m, undefined, embed);
}

const data = new SlashCommandBuilder()
    .setName("list_teams")
    .setDescription("Lists tournament teams, default lists all teams you are in")
    .addBooleanOption(option => 
        option.setName("all")
            .setDescription("List all tournament teams that exist (Default false)")
            .setRequired(false))
    .addBooleanOption(option => 
        option.setName("captain")
            .setDescription("Only list teams you are captain for (Default false)")
            .setRequired(false));

interface parameters {
    all?: boolean,
    captain?: boolean,
}

const teamList: Command = {
    data,
    alternativeNames: ["list_team", "teams_list", "team_list", "list-teams", "list-team", "teams-list", "team-list", "teamslist", "teamlist", "listteams", "listteam", "teaml", "teamsl", "lteam", "lteams"],
    category: "tournaments",
    subCategory: "teams",
    run,
};

export default teamList;