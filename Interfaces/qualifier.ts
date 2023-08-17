import { MatchupScore } from "./matchup";

export interface BaseQualifier {
    ID: number;
    date: Date;
    team?: QualifierTeam;
}

export interface Qualifier extends BaseQualifier {
    scores: MatchupScore[];
    referee?: {
        ID: number;
        username: string;
    }
    teams: QualifierTeam[];
    mp?: number | null;
}

export interface QualifierTeam {
    ID: number;
    name: string;
    avatarURL?: string | null;
}