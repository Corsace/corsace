import { Stage } from "./stage";
import { Round } from "./round";
import { Team, TeamList } from "./team";
import { User } from "./user";
import { Mappool, MappoolMap } from "./mappool";

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

export interface Matchup extends BaseMatchup {
    baseURL?: string | null;
    round?:          Round | null;
    stage?:          Stage | null;
    isLowerBracket: boolean;
    teams?: Team[] | null;
    team1?:          Team | null;
    team2?:          Team | null;
    team1Score:     number;
    team2Score:     number;
    first?:          Team | null;
    winner?:         Team | null;
    maps?:           MatchupMap[];
    mappoolsBanned?: Mappool[];
    potential:      boolean;
    forfeit:        boolean;
    vod?:            null;
    referee?:        User | null;
    streamer?:       User | null;
    commentators?:   User[] | null;
    messages?:       MatchupMessage[] | null;
}

export enum MapStatus {
    Protected,
    Banned,
    Picked,
}

export interface MatchupMap {
    ID: number;
    map: MappoolMap;
    order: number;
    status: MapStatus;
}

export interface MatchupMessage {
    ID: number;
    timestamp: Date;
    user: User;
    content: string;
}