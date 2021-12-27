import { BeatmapInfo } from "./beatmap";
import { BracketInfo } from "./bracket";
import { GroupInfo } from "./group";
import { MatchBeatmapInfo } from "./match";
import { QualifierInfo } from "./qualifier";
import { TournamentInfo } from "./tournament";

export enum ModSlots {
    NM,
    HD,
    HR,
    DT,
    FM,
    TB
}

export interface ModGroup {
    beatmaps: MappoolBeatmapInfo[]
    mod: "NM" | "HD" | "HR" | "DT" | "FM" | "TB" 
}

export interface MappoolInfo {
    ID: number,
    name: string,
    tournament: TournamentInfo, 
    beatmaps?: MappoolBeatmapInfo[],
    bracket?: BracketInfo,
    groups?: GroupInfo[], 
    qualifiers?: QualifierInfo[],

}

export interface MappoolBeatmapInfo {
    ID: number,
    mod: ModSlots,
    slot: number,
    mappool: MappoolInfo,
    beatmap: BeatmapInfo, 
    matchBeatmaps?: MatchBeatmapInfo[],
}
