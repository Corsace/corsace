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

export enum ModeDivisionType {
    standard = 1,
    taiko,
    fruits,
    mania,
    storyboard,
}

// Having this as a function instead of a constant avoids possible circular dependencies and undefined errors on instance startup
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