import { MatchBeatmapInfo, MatchInfo, MatchSetInfo } from "./match";
import { TournamentInfo } from "./tournament";
import { UserInfo } from "./user";

export interface TeamInfo {
    ID: number;
    creation: Date;
    name: string;
    slug: string;
    captain: UserInfo;
    teamAvatarUrl: string;
    membersAmount: number;
    isEligible: boolean;
    isFull: boolean;
    qualifier: Date | null; 
    averageBWS: number;
    rank: number | null;
    seed: "A" | "B" | "C" | "D" | null;
    members?: UserInfo[];
    role: string;
    demerits: number,
    tournament: TournamentInfo,
    matches?: MatchInfo[],
    mapsWon?: MatchBeatmapInfo[],
    setsWon?: MatchSetInfo[],
    matchesWon?: MatchInfo[],
    matchesFirst?: MatchInfo[],
}
