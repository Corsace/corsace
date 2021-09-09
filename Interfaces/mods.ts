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

export function parseMods (text: string): ModsType | undefined {
    const modStrings = text.match(/.{1,2}/g);
    if (!modStrings)
        return;
    let val = 0;
    for (const mod of modStrings) {
        val += modAcronyms[mod.toUpperCase()];
    }
    return val;
}

export function modsToAcronym (mod: ModsType): string {
    if (mod === 0)
        return "NM";
    let text = "";
    for (let i = 0; i < Object.keys(modAcronyms).length; i++) {
        const activated = (1 & mod) === 1;
        if (activated)
            text += modAcronyms[i];
        mod >>= 1;
    }
    return text;
}

export function applyMods (beatmap: Beatmap, difficultyscaler?: "HR"|"EZ", speedScaler?: "DT"|"HT"|"NC"): Beatmap {
    if (difficultyscaler) {
        if (difficultyscaler === "HR") {
            beatmap.diffSize = Math.min(10, beatmap.diffSize * 1.3);
            beatmap.diffApproach = Math.min(10, beatmap.diffApproach * 1.4);
            beatmap.diffOverall = Math.min(10, beatmap.diffOverall * 1.4);
            beatmap.diffDrain = Math.min(10, beatmap.diffDrain * 1.4);
        } else {
            beatmap.diffSize /= 2.0;
            beatmap.diffApproach /= 2.0;
            beatmap.diffOverall /= 2.0;
            beatmap.diffDrain /= 2.0;
        }
    }

    if (speedScaler) {
        const clock = speedScaler === "HT" ? 0.75 : 1.5;

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

function diffRange (value: number): number {
    let val = 1200;
    if (value > 5)
        val = 1200 + (450 - 1200) * (value - 5) / 5;
    else if (value < 5)
        val = 1200 - (1200 - 1800) * (5 - value) / 5;
    return val;
}

function diffValue (value: number): number {
    if (value > 1200)
        return (1800 - value) / 120;
    return (1200 - value) / 150 + 5;
}