import { Beatmap, Mods, ModsType } from "nodesu";

export const modAcronyms = {
    "NM": Mods.None,
    "NF": Mods.NoFail,
    "EZ": Mods.Easy,
    "HD": Mods.Hidden,
    "HR": Mods.HardRock,
    "SD": Mods.SuddenDeath,
    "DT": Mods.DoubleTime,
    "RX": Mods.Relax,
    "HT": Mods.HalfTime,
    "NC": Mods.Nightcore,
    "FL": Mods.Flashlight,
    "AU": Mods.Autoplay, // Auto.
    "SO": Mods.SpunOut,
    "AP": Mods.Relax2, // Autopilot.
    "PF": Mods.Perfect,
    "K4": Mods.Key4,
    "K5": Mods.Key5,
    "K6": Mods.Key6,
    "K7": Mods.Key7,
    "K8": Mods.Key8,
    "FI": Mods.FadeIn,
    "RN": Mods.Random,
    "CN": Mods.LastMod,
    "K9": Mods.Key9,
    "KC": Mods.Key10,
    "K1": Mods.Key1,
    "K3": Mods.Key3,
    "K2": Mods.Key2,
};

/**
 * Parses a list of mod acronyms into nodesu ModsType enums
 * @param text A string consisting of mods as acronyms
 * @returns Either an enum of the mods or undefined
 */
export function acronymtoMods (text: string): ModsType | undefined {
    const modStrings = text.match(/.{1,2}/g);
    if (!modStrings)
        return;
    let val = 0;
    for (const mod of modStrings) {
        val += modAcronyms[mod.toUpperCase()];
    }
    return val;
}

/**
 * Parses nodesu ModsType enum into a list of mod acronyms
 * @param mod An enum of the mods
 * @returns A string consisting of mods as acronyms
 */
export function modsToAcronym (mod: ModsType): string {
    if (mod === 0)
        return "NM";
    let text = "";
    for (let i = 0; i < Object.keys(modAcronyms).length; i++) {
        const activated = (1 & mod) === 1;
        if (activated)
            text += Object.keys(modAcronyms)[i];
        mod >>= 1;
    }
    return text;
}

/**
 * Applies mod affects to different aspects of a beatmap (DOES NOT AFFECT SR!!!)
 * @param beatmap The beatmap to change aspects of
 * @param difficultyscaler HR or EZ (undefined if neither)
 * @param speedScaler DT/NC or HT (undefined if neither)
 * @returns The beatmap with mods applied
 */
export function applyMods (beatmap: Beatmap, mods: string): Beatmap {
    if (mods.includes("HR")) {
        beatmap.diffSize = Math.min(10, beatmap.diffSize * 1.3);
        beatmap.diffApproach = Math.min(10, beatmap.diffApproach * 1.4);
        beatmap.diffOverall = Math.min(10, beatmap.diffOverall * 1.4);
        beatmap.diffDrain = Math.min(10, beatmap.diffDrain * 1.4);
    } else if (mods.includes("EZ")) {
        beatmap.diffSize /= 2.0;
        beatmap.diffApproach /= 2.0;
        beatmap.diffOverall /= 2.0;
        beatmap.diffDrain /= 2.0;
    }

    if (mods.includes("DT") || mods.includes("NC") || mods.includes("HT")) {
        const clock = mods.includes("HT") ? 0.75 : 1.5;

        beatmap.bpm *= clock;
        beatmap.totalLength /= clock;
        beatmap.hitLength /= clock;

        const arMS = diffRange(beatmap.diffApproach) / clock;
        const hitWindowGreat = (80 - 6 * beatmap.diffOverall) / clock;
        const hpMS = diffRange(beatmap.diffDrain) / clock;

        beatmap.diffApproach = diffValue(arMS);
        beatmap.diffOverall = (80 - hitWindowGreat) / 6;
        beatmap.diffDrain = diffValue(hpMS);
    }

    return beatmap;
}

/**
 * Provides the speed of AR/HP in ms as shown from https://github.com/ppy/osu/blob/0c52b26d2312bd090896bf7c65f790ca83ba0cb2/osu.Game.Rulesets.Osu/Difficulty/OsuDifficultyCalculator.cs#L59
 * @param value The initial AR/HP value
 * @returns The ms speed of AR/HP
 */
function diffRange (value: number): number {
    let val = 1200;
    if (value > 5)
        val = 1200 + (450 - 1200) * (value - 5) / 5;
    else if (value < 5)
        val = 1200 - (1200 - 1800) * (5 - value) / 5;
    return val;
}

/**
 * Converts the ms speed of AR/HP into the original usual digestable 0-10 values
 * @param value The ms speed of AR/HP
 * @returns The AR/HP value 
 */
function diffValue (value: number): number {
    if (value > 1200)
        return (1800 - value) / 120;
    return (1200 - value) / 150 + 5;
}
