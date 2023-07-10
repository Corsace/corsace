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

export type Mode = "standard" | "taiko" | "fruits" | "mania";