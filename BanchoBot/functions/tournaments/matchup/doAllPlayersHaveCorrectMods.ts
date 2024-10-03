import { BanchoLobby, BanchoMods } from "bancho.js";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import getMappoolSlotMods from "./getMappoolSlotMods";

export default function doAllPlayersHaveCorrectMods (mpLobby: BanchoLobby, slotMod: MappoolSlot) {
    if (typeof slotMod.userModCount !== "number" && typeof slotMod.uniqueModCount !== "number")
        return true;

    const allowedMods = getMappoolSlotMods(slotMod.allowedMods);
    if (
        ( // If any mods were defined
            allowedMods.length > 0 &&
            mpLobby.slots.some(slot => 
                slot?.mods.some(mod => 
                    !allowedMods.some(allowedMod => allowedMod.enumValue === mod.enumValue)
                )
            )
        ) || // If no mods were defined for the slot, then check if anyone is missing NoFail
        mpLobby.slots.some(slot => 
            slot?.mods.some(mod => (mod.enumValue & BanchoMods.NoFail.enumValue) === 0)
        )
    )
        return false;

    return true;
}