import { ChatInputCommandInteraction, EmbedBuilder, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "..";
import getUser from "../../functions/dbFunctions/getUser";
import commandUser from "../../functions/commandUser";
import { loginResponse } from "../../functions/loginResponse";
import getTournament from "../../functions/tournamentFunctions/getTournament";
import channelID from "../../functions/channelID";
import { extractParameter } from "../../functions/parameterFunctions";
import { discordStringTimestamp } from "../../../Server/utils/dateParse";
import { User } from "../../../Models/user";
import respond from "../../functions/respond";
import { StageType } from "../../../Models/tournaments/stage";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

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
        .setTitle(`Tournament ${tournament.name} (${tournament.abbreviation}) organized by ${organizer.osu.username} <@${organizer.discord.userID}>`)
        .setDescription(`**ID:** ${tournament.ID}\n**Mode:** ${tournament.mode.name}\n**Registrations Start:** ${discordStringTimestamp(tournament.registrations.start)}\n**Registrations End:** ${tournament.registrations.end}\n\n**Match Size (x vs x):** ${tournament.matchSize}\n**Team Sizes:** ${tournament.minTeamSize} - ${tournament.maxTeamSize}\n\nDescription: ${tournament.description}`)
        .addFields(
            tournament.stages.map(s => {
                return {
                    name: `**${s.name} (${s.abbreviation})** (${StageType[s.stageType]}) | ${discordStringTimestamp(s.timespan.start)} → ${discordStringTimestamp(s.timespan.end)}`,
                    value: `**Rounds:**\n${s.rounds.map(r => `r.name (${r.abbreviation})`).join("\n")}\n\n**Mappools:**\n${s.mappool?.concat(s.rounds.flatMap(r => r.mappool)).map(m => `${m.name} (${m.abbreviation})`).join("\n")}`,
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
    alternativeNames: [ "info_tournament", "info-tournament","infos", "sinfo", "tournamenti", "itournament", "tournament-info", "tournamentinfo", "infotournament", "is", "si" ],
    category: "tournaments",
    run,
};
    
export default tournamentInfo;