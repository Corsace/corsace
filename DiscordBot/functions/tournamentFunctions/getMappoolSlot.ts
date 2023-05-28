import { ChatInputCommandInteraction, Message } from "discord.js";
import getMappoolSlots from "../dbFunctions/getMappoolSlots";
import getFromList from "../getFromList";
import respond from "../respond";
import { Mappool } from "../../../Models/tournaments/mappools/mappool";

export default async function getMappoolSlot (m: Message | ChatInputCommandInteraction, mappool: Mappool, slotText = "", getMappool = false, getMaps = false, getJobPosts = false) {
    const slots = mappool.slots && (!getMaps || (getMaps && mappool.slots[0].maps[0])) ? mappool.slots.filter(slot => slot.name.toLowerCase().includes(slotText.toLowerCase()) || slot.acronym.toLowerCase().includes(slotText.toLowerCase())) : await getMappoolSlots(mappool, slotText, getMappool, getMaps, getJobPosts);

    if (slots.length === 0) {
        await respond(m, `Could not find any slots with criteria \`${slotText}\``);
        return;
    }

    const slot = await getFromList(m, slots, "slot");
    if (!slot)
        return;

    return slot;
}