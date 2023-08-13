import { TeamList } from "./team";

export interface BaseMatchup {
    ID: number;
    date: Date;
    mp?: number | null;
}

export interface MatchupList extends BaseMatchup {
    vod?:   string | null;
    potential?: string;
    teams: TeamList[] | null;
}