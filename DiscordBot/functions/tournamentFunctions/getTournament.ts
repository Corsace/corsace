import { ChatInputCommandInteraction, Message } from "discord.js";
import { TournamentStatus } from "../../../Models/tournaments/tournament";
import getTournaments, { tournamentSearchConditions } from "../../../Server/functions/get/getTournaments";
import respond from "../respond";
import getFromList from "../getFromList";

export default async function getTournament (m: Message | ChatInputCommandInteraction, target: string = m.channel?.isThread() && m.channel.parent?.id ? m.channel.parent?.id : m.channel?.id ?? m.guild?.id ?? "", searchType: keyof typeof tournamentSearchConditions = m.channel ? "channel" : m.guild ? "server" : "ID", tournamentStatusFilters?: TournamentStatus[], stageOrRound?: boolean, mappools?: boolean, slots?: boolean, maps?: boolean, jobPosts?: boolean) {
    let tournamentList = await getTournaments(target, searchType, tournamentStatusFilters, stageOrRound, mappools, slots, maps, jobPosts);
    if (tournamentList.length === 0) {
        if (searchType !== "channel" || !m.guild) {
            await respond(m, `Can't find any tournaments with ${searchType} \`${target}\` in this server`);
            return;
        }

        tournamentList = await getTournaments(m.guild.id, "server", tournamentStatusFilters, stageOrRound, mappools, slots, maps, jobPosts);
        if (tournamentList.length === 0) {
            await respond(m, `Can't find any tournaments with ${searchType} in <#${target}>`);
            return;
        }
    }

    const tournament = await getFromList(m, tournamentList, "tournament", target);
    if (!tournament)
        return;

    return tournament;
}