export interface BracketData {
    size: number;
    setSize?: number;
    matchSize: number;
}

export const smallRounds = {
    8: "quarter finals",
    4: "semi finals",
    2: "finals",
    1: "grand finals",
}

export const smallRoundsAcronyms = {
    8: "QF",
    4: "SF",
    2: "F",
    1: "GF",
}