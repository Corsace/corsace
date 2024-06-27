import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "..";
import { Team } from "../../../Models/tournaments/team";
import { extractParameter } from "../../functions/parameterFunctions";
import getTournament from "../../functions/tournamentFunctions/getTournament";
import channelID from "../../functions/channelID";
import respond from "../../functions/respond";
import { EmbedBuilder } from "../../functions/embedBuilder";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const tournamentParam = extractParameter(m, { name: "tournament", paramType: "string" }, 1);

    const tournament = await getTournament(m, typeof tournamentParam === "string" ? tournamentParam : channelID(m), typeof tournamentParam === "string" ? "name" : "channel", undefined, true, true);
    if (!tournament)
        return;

    const teams = await Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .leftJoin("team.tournaments", "tournament")
        .where("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
        .getMany();

    const embed = new EmbedBuilder()
        .setTitle(`Teams for ${tournament.name}`)
        .setDescription(
            teams.map(team => {
                return `**${team.name}** (${team.abbreviation})\n**Manager:** ${team.manager.osu.username} <@${team.manager.discord.userID}>\n**Members:** ${team.members.map(m => m.osu.username).join(", ")}`;
            }).join("\n\n"))
        .setFooter({
            text: `Requested by ${m instanceof Message ? m.author.username : m.user.username}`,
            icon_url: (m instanceof Message ? m.author.avatarURL() : m.user.avatarURL()) ?? undefined,
        });

    await respond(m, undefined, embed);
}

const data = new SlashCommandBuilder()
    .setName("tournament_teams")
    .setDescription("Get a list of teams for a tournament.")
    .addStringOption(option => 
        option.setName("tournament")
            .setDescription("The tournament to get teams for (not required).")
            .setRequired(false));

const tournamentTeams: Command = {
    data,
    alternativeNames: [ "teams_tournament", "teams-tournament","teamst", "tteams", "tournamentt", "ttournament", "tournament-teams", "tournamentteams", "teamstournament", "tt" ],
    category: "tournaments",
    run,
};
    
export default tournamentTeams;