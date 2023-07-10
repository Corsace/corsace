import { BanchoLobby } from "bancho.js";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import getMappoolSlotMods from "./getMappoolSlotMods";

export default function doAllPlayersHaveCorrectMods (mpLobby: BanchoLobby, slotMod: MappoolSlot) {
    if (typeof slotMod.userModCount !== "number" && typeof slotMod.uniqueModCount !== "number")
        return true;

    const allowedMods = getMappoolSlotMods(slotMod.allowedMods);
    if (
        mpLobby.slots.some(slot => 
            slot.mods.some(mod => 
                !allowedMods.some(allowedMod => allowedMod.enumValue === mod.enumValue)
            )
        )
    )
        return false;
}