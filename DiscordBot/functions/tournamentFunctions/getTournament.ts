import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Message, MessageComponentInteraction } from "discord.js";
import { TournamentStatus } from "../../../Models/tournaments/tournament";
import getTournaments, { tournamentSearchConditions } from "../dbFunctions/getTournaments";
import respond from "../respond";
import getFromList from "../getFromList";

export default async function getTournament (m: Message | ChatInputCommandInteraction, target: string, searchType: keyof typeof tournamentSearchConditions, channelID?: string, tournamentStatusFilters?: TournamentStatus[], stages?: boolean, rounds?: boolean) {
    const tournamentList = await getTournaments(target, searchType, channelID, tournamentStatusFilters, stages, rounds);
    if (tournamentList.length === 0) {
        if (channelID)
            await respond(m, `Could not find any tournaments with ${searchType} \`${target}\` in <#${channelID}>.`);
        else
            await respond(m, `Could not find any tournaments with ${searchType} \`${target}\` in this server.`);
        return;
    }

    const tournament = await getFromList(m, tournamentList, "tournament");
    if (!tournament)
        return;

    return tournament;
}