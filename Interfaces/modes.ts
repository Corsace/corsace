import { ModeDivisionType } from "../Models/MCA_AYIM/modeDivision";

export interface ModeDivision {
    ID: number;
    name: string;
}

export const modeList = [
    "standard",
    "taiko",
    "fruits",
    "mania",
];

export function modeIDToMode () {
    return {
        [ModeDivisionType.standard]: "osu",
        [ModeDivisionType.taiko]: "taiko",
        [ModeDivisionType.fruits]: "fruits",
        [ModeDivisionType.mania]: "mania",
        [ModeDivisionType.storyboard]: "osu",
    } as { [key in ModeDivisionType]: Mode };
}

export type Mode = "osu" | "taiko" | "fruits" | "mania";