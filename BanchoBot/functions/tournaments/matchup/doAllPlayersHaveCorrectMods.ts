import { BanchoLobby } from "bancho.js";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import getMappoolSlotMods from "./getMappoolSlotMods";

export default function doAllPlayersHaveCorrectMods (mpLobby: BanchoLobby, slotMod: MappoolSlot) {
    if (typeof slotMod.userModCount !== "number" && typeof slotMod.uniqueModCount !== "number")
        return true;

    const allowedMods = getMappoolSlotMods(slotMod.allowedMods);
    if (allowedMods.length === 0)
        // Any slot that exists and doesn't have NoFail is invalid
        return !mpLobby.slots.some(slot => 
            slot &&
            !slot.mods.some(mod => mod.enumValue === 1)
        );

    return !mpLobby.slots.some(slot => 
        slot &&
        (
            !slot.mods.some(mod => mod.enumValue === 1) ||
            slot.mods.some(mod => !allowedMods.some(allowedMod => allowedMod.enumValue === mod.enumValue)) ||
            allowedMods.filter(mod => mod.enumValue !== 1).every(allowedMod => !slot.mods.some(mod => mod.enumValue === allowedMod.enumValue))
        )
    );
}