import { ChatInputCommandInteraction, Message } from "discord.js";
import getMappoolSlots from "../dbFunctions/getMappoolSlots";
import getFromList from "../getFromList";
import respond from "../respond";
import { Mappool } from "../../../Models/tournaments/mappools/mappool";

export async function getSlot (m: Message | ChatInputCommandInteraction, mappool: Mappool, slotText: string = "", getRelations: boolean = false) {
    const slots = mappool.slots ? mappool.slots.filter(slot => slot.name.toLowerCase().includes(slotText.toLowerCase())) : await getMappoolSlots(mappool, slotText, getRelations);

    if (slots.length === 0) {
        await respond(m, `Could not find any slots with criteria \`${slotText}\``);
        return;
    }

    const slot = await getFromList(m, slots, "slot");
    if (!slot)
        return;

    return slot;
}