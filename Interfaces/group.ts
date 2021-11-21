import { MappoolInfo } from "./mappool";
import { MatchInfo } from "./match";
import { TournamentInfo } from "./tournament";

export interface GroupInfo {
    ID: number,
    tournament: TournamentInfo;
    mappool: MappoolInfo,
    matches: MatchInfo[],
}