import { ChatInputCommandInteraction, EmbedBuilder, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../";
import { extractParameters } from "../../../functions/parameterFunctions";
import { Team } from "../../../../Models/tournaments/team";
import commandUser from "../../../functions/commandUser";
import respond from "../../../functions/respond";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();
        
    const params = extractParameters<parameters>(m, [
        { name: "all", shortName: "a", paramType: "boolean", optional: true },
        { name: "manager", shortName: "m", paramType: "boolean", optional: true },
    ]);
    if (!params)
        return;

    const { all, manager } = params;

    const teamQ = Team
        .createQueryBuilder("team")
        .innerJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("team.tournaments", "tournament");

    if (!all) {
        teamQ.where("manager.discordUserid = :discordUserID", { discordUserID: commandUser(m).id });
        if (!manager)
            teamQ.orWhere("member.discordUserid = :discordUserID", { discordUserID: commandUser(m).id });
    }

    const teams = await teamQ.getMany();
    
    const embed = new EmbedBuilder()
        .setTitle("Teams")
        .setDescription(`Showing ${teams.length} teams`)
        .setFields(teams.map(team => {
            return {
                name: `${team.name} (${team.abbreviation})`,
                value: `Manager: ${team.manager.osu.username} <@${team.manager.discord.userID}> (${team.manager.osu.userID})\nMembers: ${team.members.map(member => `${member.osu.username} <@${member.discord.userID}> (${member.osu.userID})`).join(", ")}\nTournaments: ${team.tournaments.map(tournament => `${tournament.name} (${tournament.abbreviation})`).join(", ")}`,
            };
        }));

    await respond(m, undefined, [ embed ]);
}

const data = new SlashCommandBuilder()
    .setName("list_teams")
    .setDescription("Lists tournament teams, default lists all teams you are in/")
    .addBooleanOption(option => 
        option.setName("all")
            .setDescription("List all tournament teams that exist (Default false)")
            .setRequired(false)
    )
    .addBooleanOption(option => 
        option.setName("manager")
            .setDescription("Only list teams you manage (Default false)")
            .setRequired(false)
    );

interface parameters {
    all?: boolean,
    manager?: boolean,
}

const teamList: Command = {
    data,
    alternativeNames: ["list_team", "teams_list", "team_list", "list-teams", "list-team", "teams-list", "team-list", "teamslist", "teamlist", "listteams", "listteam", "listt", "tlist", "teaml", "teamsl", "lteam", "lteams"],
    category: "tournaments",
    subCategory: "teams",
    run,
};

export default teamList;