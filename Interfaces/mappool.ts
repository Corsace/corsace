import { MatchBeatmapInfo } from "./match";
import { QualifierInfo } from "./qualifier";

export enum ModSlots {
    NM,
    HD,
    HR,
    DT,
    FM,
    TB
}

export interface ModGroup {
    beatmaps: MappoolMap[]
    mod: "NM" | "HD" | "HR" | "DT" | "FM" | "TB" 
}

export interface MappoolInfo {
    ID: number,
    name: string,
    tournament: TournamentInfo, 
    beatmaps: MappoolBeatmapInfo,
    brakcet: BracketInfo,
    groups: GroupInfo[], 
    qualifiers: QualifierInfo[],

}

export interface MappoolBeatmapInfo {
    ID: number,
    mod: ModSlots,
    slot: number,
    mappool: MappoolInfo,
    beatmap: BeatmapInfo, // ? 
    matchBeatmaps: MatchBeatmapInfo,
}
