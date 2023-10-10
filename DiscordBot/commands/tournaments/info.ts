import { ChatInputCommandInteraction, EmbedBuilder, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "..";
import getTournament from "../../functions/tournamentFunctions/getTournament";
import channelID from "../../functions/channelID";
import { extractParameter } from "../../functions/parameterFunctions";
import { discordStringTimestamp } from "../../../Server/utils/dateParse";
import { User } from "../../../Models/user";
import respond from "../../functions/respond";
import { StageType } from "../../../Interfaces/stage";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const tournamentParam = extractParameter(m, { name: "tournament", paramType: "string" }, 1);

    const tournament = await getTournament(m, typeof tournamentParam === "string" ? tournamentParam : channelID(m), typeof tournamentParam === "string" ? "name" : "channel", undefined, true, true);
    if (!tournament)
        return;

    const organizer = await User
        .createQueryBuilder("user")
        .leftJoin("user.tournamentsOrganized", "tournament")
        .where("tournament.ID = :ID", { ID: tournament.ID })
        .getOne();
    if (!organizer) {
        await respond(m, `Somehow couldn't find the organizer for the tournament, contact VINXIS`);
        return;
    }

    // Create a discord embed for the tournament, listing its stages
    const embed = new EmbedBuilder()
        .setTitle(`${tournament.name} (${tournament.abbreviation})`)
        .setDescription(`Organized by ${organizer.osu.username} <@${organizer.discord.userID}>\n\n**ID:** ${tournament.ID}\n**Mode:** ${tournament.mode.name}\n**Registrations Start:** ${discordStringTimestamp(tournament.registrations.start)}\n**Registrations End:** ${discordStringTimestamp(tournament.registrations.end)}\n\n**Matchup Size:** ${tournament.matchupSize}v${tournament.matchupSize}\n**Team Sizes:** ${tournament.maxTeamSize === tournament.minTeamSize ? `${tournament.minTeamSize}` : `${tournament.minTeamSize} - ${tournament.maxTeamSize}`} player${tournament.maxTeamSize > 1 ? "s" : ""}\n\n**Description:** ${tournament.description}`)
        .addFields(
            tournament.stages.map(s => {
                return {
                    name: `**${s.name} (${s.abbreviation})** (${StageType[s.stageType]}) | ${discordStringTimestamp(s.timespan.start)} → ${discordStringTimestamp(s.timespan.end)}`,
                    value: `**Rounds:**\n${s.rounds.map(r => `${r.name} (${r.abbreviation})`).join("\n") ?? "None"}\n\n**Mappools:**\n${s.mappool?.concat(s.rounds.flatMap(r => r.mappool)).map(m => `${m.name} (${m.abbreviation})`).join("\n") ?? "None"}`,
                    inline: true,
                };
            })
        );

    await respond(m, undefined, [ embed ]);
}

const data = new SlashCommandBuilder()
    .setName("tournament_info")
    .setDescription("Get info for a tournament.")
    .addStringOption(option => 
        option.setName("tournament")
            .setDescription("The tournament to get info for (not required).")
            .setRequired(false));

const tournamentInfo: Command = {
    data,
    alternativeNames: [ "info_tournament", "info-tournament","infot", "tinfo", "tournamenti", "itournament", "tournament-info", "tournamentinfo", "infotournament", "it", "ti" ],
    category: "tournaments",
    run,
};
    
export default tournamentInfo;