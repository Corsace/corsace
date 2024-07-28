import { MatchupScore } from "./matchup";
import { BaseTeam, TeamList } from "./team";

export interface BaseQualifier {
    ID: number;
    date: Date;
    team?: TeamList;
}

export interface Qualifier extends BaseQualifier {
    scores: MatchupScore[];
    referee?: {
        ID: number;
        username: string;
    }
    teams: BaseTeam[];
    mp?: number | null;
}