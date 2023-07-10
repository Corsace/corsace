import { ChatInputCommandInteraction, Message } from "discord.js";
import { Tournament } from "../../../Models/tournaments/tournament";
import respond from "../respond";
import getFromList from "../getFromList";
import getMappools from "../../../Server/functions/get/getMappools";

export default async function getMappool (m: Message | ChatInputCommandInteraction, tournament: Tournament, poolText = "", getStageRound = false, getSlots = false, getMaps = false) {
    const mappools = await getMappools(tournament, poolText, getStageRound, getSlots, getMaps);
    if (mappools.length === 0) {
        await respond(m, `Can't find any mappools with criteria \`${poolText}\``);
        return;
    }

    const mappool = await getFromList(m, mappools, "mappool", poolText);
    if (!mappool)
        return;

    return mappool;
}