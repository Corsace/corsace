import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Message, MessageComponentInteraction } from "discord.js";
import { TournamentStatus } from "../../../Models/tournaments/tournament";
import getTournaments, { tournamentSearchConditions } from "../dbFunctions/getTournaments";
import respond from "../respond";
import getFromList from "../getFromList";

export default async function getTournament (m: Message | ChatInputCommandInteraction, target: string = m.guild?.id || "", searchType: keyof typeof tournamentSearchConditions = m.guild ? "server" : "ID", tournamentStatusFilters?: TournamentStatus[], stageOrRound?: boolean, mappools?: boolean, slots?: boolean, maps?: boolean, jobPosts?: boolean) {
    const tournamentList = await getTournaments(target, searchType, tournamentStatusFilters, stageOrRound, mappools, slots, maps, jobPosts);
    if (tournamentList.length === 0) {
        if (searchType === "channel")
            await respond(m, `Could not find any tournaments with ${searchType} in <#${target}>.`);
        else
            await respond(m, `Could not find any tournaments with ${searchType} \`${target}\` in this server.`);
        return;
    }

    const tournament = await getFromList(m, tournamentList, "tournament");
    if (!tournament)
        return;

    return tournament;
}