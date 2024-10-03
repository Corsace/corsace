import { BanchoMod, BanchoMods } from "bancho.js";

export default function getMappoolSlotMods (allowedModsEnum: number | null | undefined): BanchoMod[] {
    if (typeof allowedModsEnum !== "number")
        return [];

    const modParse = BanchoMods.parseBitFlags(allowedModsEnum, true).concat(BanchoMods.NoFail); // Default NoFail requirements
    return modParse.filter((v, i, a) => a.findIndex(m => m.enumValue === v.enumValue) === i); // If a mappool slot's allowedMods has NoFail already, then it will filter it out.
}