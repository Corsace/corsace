import { BracketInfo } from "./bracket";
import { GroupInfo } from "./group";
import { MappoolBeatmapInfo } from "./mappool";
import { TeamInfo } from "./team";
import { UserInfo } from "./user";

export interface MatchPlayInfo {
    ID: number,
    user: UserInfo,
    score: number,
    mods: string,
    misses: number,
    combo: number,
    accuracy: number,
    FC: boolean,
    fail: boolean,
}

export interface MatchBeatmapInfo {
    ID: number,
    status: PickStatus,
    beatmap: MappoolBeatmapInfo,
    match?: MatchInfo,
    set?: MatchSetInfo,
    scores?: MatchPlayInfo[],
    winner?: TeamInfo,
}

export interface MatchSetInfo {
    ID: number;
    match: MatchInfo,
    winner?: TeamInfo,
    beatmaps?: MatchBeatmapInfo[],
    teamAScore: number,
    teamBScore: number,
}

export interface MatchInfo {
    ID: number,
    matchID: string,
    time: Date,
    bracket?: BracketInfo,
    group?: GroupInfo,
    teamA?: TeamInfo,
    teamB?: TeamInfo,
    teamAScore: number,
    teamBScore: number,
    first?: TeamInfo,
    winner?: TeamInfo,
    sets?: MatchSetInfo[],
    beatmaps?: MatchBeatmapInfo[],
    forfeit: boolean,
    potential: boolean,
    referee?: UserInfo,
    commentators?: UserInfo[],
    streamer?: UserInfo,
    twitch?: string,
    mp?: number,
}



export enum PickStatus {
    picked,
    banned
}

/**
 * Obtained from https://github.com/ppy/osu-api/wiki#mods
 */
export enum Mods {
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
    Nightcore      = 512,
    Flashlight     = 1024,
    Autoplay       = 2048,
    SpunOut        = 4096,
    Autopilot      = 8192,
    Perfect        = 16384,
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
    FreeModAllowed = NoFail | Easy | Hidden | HardRock | SuddenDeath | Flashlight | FadeIn | Relax | Autopilot | SpunOut | KeyMod,
    ScoreIncreaseMods = Hidden | HardRock | DoubleTime | Flashlight | FadeIn,
}

const modStrings: string[] = [
    "NF",
    "EZ",
    "NV",
    "HD",
    "HR",
    "SD",
    "DT",
    "RX",
    "HT",
    "NC",
    "FL",
    "AU",
    "SO",
    "AP",
    "PF",
    "K4",
    "K5",
    "K6",
    "K7",
    "K8",
    "FI",
    "RN",
    "CN",
    "TR",
    "K9",
    "KC",
    "K1",
    "K3",
    "K2",
    "V2",
];

export function modsToString (m: Mods): string {
    if (m === 0)
        return "NM";

    let stringBuilder = "";
    for (let i = 0; i < modStrings.length; i ++) {
        if ((1 & m) === 1)
            stringBuilder += modStrings[i];
        m >>= 1;
    }
    if (stringBuilder.includes("NC"))
        stringBuilder = stringBuilder.replace("DT", "");
    if (stringBuilder.includes("PF"))
        stringBuilder = stringBuilder.replace("SD", "");

    return stringBuilder;
}

