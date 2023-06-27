import { BanchoMod, BanchoMods } from "bancho.js";

export default function getStageMods (modEnum: number | null | undefined): BanchoMod[] {
    const modParse = BanchoMods.parseBitFlags(modEnum || 0, true).concat(BanchoMods.NoFail);
    
    return modParse.concat(BanchoMods.NoFail).filter((v, i, a) => a.findIndex(m => m.enumValue === v.enumValue) === i);
}