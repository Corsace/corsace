import { MappoolInfo } from "./mappool";
import { MatchInfo } from "./match";
import { TournamentInfo } from "./tournament";

export interface BracketInfo {
    ID: number,
    name: string,
    tournament: TournamentInfo,
    mappool: MappoolInfo,
    matches: MatchInfo[],
}