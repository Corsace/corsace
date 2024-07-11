import { Beatmap, ModsType } from "nodesu";

enum Mods
{
    None           = 0,
    NoFail         = 1,
    Easy           = 2,
    TouchDevice    = 4,
    Hidden         = 8,
    HardRock       = 16,
    SuddenDeath    = 32,
    DoubleTime     = 64,
    Relax          = 128,
    HalfTime       = 256,
    Nightcore      = 512, // Only set along with DoubleTime. i.e: NC only gives 576
    Flashlight     = 1024,
    Autoplay       = 2048,
    SpunOut        = 4096,
    Relax2         = 8192,    // Autopilot
    Perfect        = 16384, // Only set along with SuddenDeath. i.e: PF only gives 16416  
    Key4           = 32768,
    Key5           = 65536,
    Key6           = 131072,
    Key7           = 262144,
    Key8           = 524288,
    FadeIn         = 1048576,
    Random         = 2097152,
    Cinema         = 4194304,
    Target         = 8388608,
    Key9           = 16777216,
    KeyCoop        = 33554432,
    Key1           = 67108864,
    Key3           = 134217728,
    Key2           = 268435456,
    ScoreV2        = 536870912,
    Mirror         = 1073741824,
    KeyMod = Key1 | Key2 | Key3 | Key4 | Key5 | Key6 | Key7 | Key8 | Key9 | KeyCoop,
    FreeModAllowed = NoFail | Easy | Hidden | HardRock | SuddenDeath | Flashlight | FadeIn | Relax | Relax2 | SpunOut | KeyMod,
    ScoreIncreaseMods = Hidden | HardRock | DoubleTime | Flashlight | FadeIn
}

export const modAcronyms = {
    "NM": Mods.None,
    "NF": Mods.NoFail,
    "EZ": Mods.Easy,
    "TD": Mods.TouchDevice,
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
    "CN": Mods.Cinema,
    "K9": Mods.Key9,
    "KC": Mods.KeyCoop,
    "K1": Mods.Key1,
    "K3": Mods.Key3,
    "K2": Mods.Key2,
    "V2": Mods.ScoreV2,
    "MR": Mods.Mirror,
};

// RGB values for different mod slots
export const freemodRGB: [number, number, number] = [158, 216, 84];
export const freemodButFreerRGB: [number, number, number] = [235, 235, 235];

const modsRGB: Record<number, [number, number, number]> = {
    0: [41, 168, 249],
    1: [242, 129, 65],
    2: [236, 255, 184],
    4: [240, 157, 157],
    8: [251, 186, 32],
    16: [242, 65, 65],
    32: [164, 164, 164],
    64: [219, 174, 255],
    128: [177, 232, 225],
    256: [188, 111, 171],
    512: [186, 107, 248],
    576: [186, 107, 248],
    1024: [255, 233, 157],
    2048: [94, 203, 196],
    4096: [30, 208, 155],
    8192: [218, 254, 241],
    16384: [225, 255, 103],
    32768: [236, 169, 209],
    65536: [236, 169, 209],
    131072: [236, 169, 209],
    262144: [236, 169, 209],
    524288: [236, 169, 209],
    1048576: [130, 161, 240],
    2097152: [130, 161, 240],
    4194304: [130, 161, 240],
    8388608: [130, 161, 240],
    16777216: [236, 169, 209],
    33554432: [236, 169, 209],
    67108864: [236, 169, 209],
    134217728: [236, 169, 209],
    268435456: [236, 169, 209],
    1073741824: [238, 162, 145],
};

export function modsToRGB (modNum?: ModsType | null): [number, number, number] {
    if (!modNum)
        return modsRGB[0];

    const colours: [number, number, number][] = [];
    for (const mod in modsRGB) {
        if (modNum && (modNum & parseInt(mod))) {
            colours.push(modsRGB[mod]);
        }
    }

    if (colours.length === 0)
        return modsRGB[0];

    const averageColour = colours.reduce((acc, val) => {
        return [acc[0] + val[0], acc[1] + val[1], acc[2] + val[2]];
    }, [0, 0, 0]).map((val) => Math.floor(val / colours.length)) as [number, number, number];

    return averageColour;
}

/**
 * Parses a list of mod acronyms into nodesu ModsType enums
 * @param text A string consisting of mods as acronyms
 * @returns Either an enum of the mods or undefined
 */
export function acronymtoMods (text: string): ModsType | undefined {
    const modStrings = text.match(/.{2}/g);
    if (!modStrings)
        return;
    let val = 0;
    for (const mod of modStrings)
        if (mod.toUpperCase() in modAcronyms)
            val += modAcronyms[mod.toUpperCase() as keyof typeof modAcronyms];
    
    if (isNaN(val))
        return;

    return val;
}

/**
 * Parses nodesu ModsType enum into a list of mod acronyms
 * @param mod An enum of the mods
 * @returns A string consisting of mods as acronyms
 */
export function modsToAcronym (mod?: ModsType): string {
    if (!mod || mod === 0)
        return "NM";
    let text = "";
    for (const acronym in modAcronyms) {
        const modValue = modAcronyms[acronym as keyof typeof modAcronyms];
        if ((mod & modValue) !== 0)
            text += acronym;
    }
    return text;
}

/**
 * Applies mod affects to different aspects of a beatmap (DOES NOT AFFECT SR!!!)
 * @param beatmap The beatmap to change aspects of
 * @param mods A string consisting of mods as 2 letter acronyms
 * @returns The beatmap with mods applied
 */
export function applyMods (beatmap: Beatmap, mods: string): Beatmap {
    mods = mods.toLowerCase();
    if (mods.includes("hr")) {
        beatmap.diffSize = Math.min(10, beatmap.diffSize * 1.3);
        beatmap.diffApproach = Math.min(10, beatmap.diffApproach * 1.4);
        beatmap.diffOverall = Math.min(10, beatmap.diffOverall * 1.4);
        beatmap.diffDrain = Math.min(10, beatmap.diffDrain * 1.4);
    } else if (mods.includes("ez")) {
        beatmap.diffSize /= 2.0;
        beatmap.diffApproach /= 2.0;
        beatmap.diffOverall /= 2.0;
        beatmap.diffDrain /= 2.0;
    }

    if (mods.includes("dt") || mods.includes("nc") || mods.includes("ht")) {
        const clock = mods.includes("ht") ? 0.75 : 1.5;

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
