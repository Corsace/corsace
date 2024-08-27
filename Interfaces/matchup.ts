import { Stage } from "./stage";
import { Round } from "./round";
import { Team, TeamList } from "./team";
import { User, UserSummary } from "./user";
import { Mappool, MappoolMap } from "./mappool";
import { BaseStaffMember } from "./staff";

export interface BaseMatchup {
    ID: number;
    matchID: string;
    date: Date;
    mp?: number | null;
}

export interface MatchupList extends BaseMatchup {
    vod?:   string | null;
    potentialFor?: string;
    forfeit: boolean;
    teams: TeamList[] | null;
    team1Score: number;
    team2Score: number;
    referee?: BaseStaffMember;
    streamer?: BaseStaffMember;
    commentators?: BaseStaffMember[];
}

export interface Matchup extends BaseMatchup {
    baseURL?:           string | null;
    round?:             Round | null;
    stage?:             Stage | null;
    isLowerBracket:     boolean;
    teams?:             Team[] | null;
    team1?:             Team | null;
    team2?:             Team | null;
    team1Score:         number;
    team2Score:         number;
    winner?:            Team | null;
    sets?:              MatchupSet[] | null;
    mappoolsBanned?:    Mappool[] | null;
    potential:          boolean;
    forfeit:            boolean;
    referee?:           User | null;
    streamer?:          User | null;
    commentators?:      User[] | null;
    messages?:          MatchupMessageDetailed[] | null;
}

export enum MapStatus {
    Protected,
    Banned,
    Picked,
}

export interface MatchupSet {
    ID:         number;
    order:      number;
    first?:     Team | null;
    maps:       MatchupMap[] | null;
    team1Score: number;
    team2Score: number;
}

export interface MatchupMap {
    ID: number;
    map: MappoolMap;
    order: number;
    status: MapStatus;
    scores: MatchupScore[];
}

export interface MatchupMessage {
    ID: number;
    timestamp: Date;
    content: string;
}

export interface MatchupMessageBasic extends MatchupMessage {
    user: UserSummary;
}

export interface MatchupMessageDetailed extends MatchupMessage {
    user: User;
}

export interface MatchupScore {
    teamID: number;
    teamName: string;
    teamAvatar?: string | null;
    username: string;
    userID: number;
    score: number;
    map: string;
    mapID: number;
}

export const scoreFilters = ["zScore", "relMax", "percentMax", "relAvg", "percentAvg", "score", "average"];

export type scoreSortType = typeof scoreFilters[number];

export const numberFormats: Record<scoreSortType, (v: number, hide: boolean) => string> = {
    zScore: (v, hide) => hide ? "" : v.toFixed(2),
    relMax: (v, hide) => hide ? "" : v.toFixed(2),
    percentMax: (v, hide) => hide ? "" : v.toFixed(2) + "%",
    relAvg: (v, hide) => hide ? "" : v.toFixed(2),
    percentAvg: (v, hide) => hide ? "" : v.toFixed(2) + "%",
    score: (v, hide) => hide ? "" : v.toLocaleString(),
    average: (v, hide) => hide ? "" : v.toLocaleString(),
};

export type MatchupScoreFilterValues = {
    [K in scoreSortType]: number;
};

export interface MatchupScoreViewScoreBase {
    map: string;
    mapID: number;
    isBest: boolean;
}

export type MatchupScoreViewScore = MatchupScoreViewScoreBase & MatchupScoreFilterValues;

export interface MatchupScoreViewBase {
    ID: number;
    name: string;
    team?: string;
    teamID?: number;
    teamAvatar?: string | null;
    avatar?: string | null;
    scores: MatchupScoreViewScore[];
    best: string;
    worst: string;
    truePlacement: number;
    sortPlacement: number;
}

export type MatchupScoreView = MatchupScoreViewBase & MatchupScoreFilterValues;

export function mapNames (scores: MatchupScore[] | null): {
    map: string;
    mapID: number;
}[] {
    if (!scores)
        return [];

    const scoreMaps = scores
        .map(s => ({
            map: s.map,
            mapID: s.mapID,
        }))
        .filter((v, i, a) => a.findIndex(t => (t.map === v.map && t.mapID === v.mapID)) === i);

    scoreMaps.sort((a, b) => a.mapID - b.mapID);
    return scoreMaps;
}

export function matchIDAlphanumericSort (a: MatchupList, b: MatchupList): number {
    const regex = /(\d+)|(\D+)/g;
    const aParts = a.matchID.match(regex);
    const bParts = b.matchID.match(regex);

    if (aParts === null || bParts === null)
        return 0;

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] || "";
        const bPart = bParts[i] || "";

        const aIsNumber = !isNaN(Number(aPart));
        const bIsNumber = !isNaN(Number(bPart));

        if (aIsNumber && bIsNumber) {
            const comparison = Number(aPart) - Number(bPart);
            if (comparison !== 0) return comparison;
        } else
            if (aPart !== bPart) return aPart.localeCompare(bPart);
    }

    return 0;
}

export function computeScoreViews (
    idNameAccessor: (score: MatchupScore) => { id: number, name: string, avatar?: string | null },
    scores: MatchupScore[] | null,
    syncView: "players" | "teams",
    currentFilter: scoreSortType,
    mapSort: number,
    sortDir: "asc" | "desc",
    matchupSize: number
): MatchupScoreView[] {
    if (!scores || scores.length === 0)
        return [];

    const scoreViews: MatchupScoreView[] = [];
    const idNames = scores.map(idNameAccessor).filter((v, i, a) => a.findIndex(t => (t.id === v.id && t.name === v.name)) === i);
    const mapNameList = mapNames(scores);

    const scoresByAccessorID = new Map<number, MatchupScore[]>();
    const scoresByMapID = new Map<number, number[]>();
    for (const score of scores) {
        const userID = idNameAccessor(score).id;
        const accessedScores = scoresByAccessorID.get(userID) ?? [];
        accessedScores.push(score);
        scoresByAccessorID.set(userID, accessedScores);
    }

    // Create score objects for each player
    for (const idName of idNames) {
        const accessedScores = scoresByAccessorID.get(idName.id)!;

        // For any maps played more than once, only save the average of the scores
        const uniqueScoring = new Map<number, number>();
        accessedScores.forEach(score => {
            const mapScore = uniqueScoring.get(score.mapID) ?? 0;
            uniqueScoring.set(score.mapID, mapScore + score.score);
        });
        const uniqueMapScores = accessedScores.map(score => {
            const mapScore = uniqueScoring.get(score.mapID)!;
            const scoreCount = accessedScores.filter(s => s.mapID === score.mapID).length || 1;
            return {
                ...score,
                score: Math.round(mapScore / (syncView === "players" ? scoreCount : Math.floor((scoreCount - 1) / matchupSize) + 1)),
            };
        }).filter((v, i, a) => a.findIndex(t => (t.mapID === v.mapID)) === i);

        const nonZeroScores = uniqueMapScores.filter(score => score.score !== 0);
        if (nonZeroScores.length === 0)
            continue;

        const filterValues: MatchupScoreFilterValues = {
            score: uniqueMapScores.reduce((a, b) => a + b.score, 0),
            average: Math.round(nonZeroScores.reduce((a, b) => a + b.score, 0) / (nonZeroScores.length || 1)),
            relMax: -100,
            percentMax: -100,
            relAvg: -100,
            percentAvg: -100,
            zScore: -100,
        };

        const scoreView = {
            ...filterValues,
            ID: idName.id,
            name: idName.name,
            avatar: idName.avatar,
            scores: mapNameList.map(map => {
                const mapScores = uniqueMapScores.filter(score => score.mapID === map.mapID);
                const score = mapScores.reduce((a, b) => a + b.score, 0);
                const avgScore = Math.round(score / (mapScores.length || 1));

                const mapID = map.mapID;
                const mapScoreHash = scoresByMapID.get(mapID) ?? [];
                mapScoreHash.push(score);
                scoresByMapID.set(mapID, mapScoreHash);

                const userFilterValues: MatchupScoreFilterValues = {
                    score,
                    average: avgScore,
                    relMax: -100,
                    percentMax: -100,
                    relAvg: -100,
                    percentAvg: -100,
                    zScore: -100,
                };

                const result = {
                    ...userFilterValues,
                    map: map.map,
                    mapID: map.mapID,
                    isBest: false,
                } as MatchupScoreViewScore;

                return result;
            }),
            best: "",
            worst: "",
            truePlacement: -1,
            sortPlacement: -1,
        } as MatchupScoreView;
        scoreView.scores.sort((a, b) => a.mapID - b.mapID);

        if (syncView === "players") {
            const team = uniqueMapScores.find(s => s.userID === idName.id);
            if (team) {
                scoreView.team = team.teamName;
                scoreView.teamID = team.teamID;
                scoreView.teamAvatar = team.teamAvatar;
            }
        }
        scoreViews.push(scoreView);
    }

    // Compute stats for each map
    const statsByMapID = new Map<number, {
        max: number;
        avg: number;
        stdDev: number;
    }>();
    for (const mapID of scoresByMapID.keys()) {
        const mapScores = scoresByMapID.get(mapID)!;
        const max = Math.max(...mapScores);
        const avg = mapScores.reduce((a, b) => a + b, 0) / (mapScores.length || 1);
        const stdDev = Math.sqrt(mapScores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / (mapScores.length || 1));
        statsByMapID.set(mapID, { max, avg, stdDev });
    }

    // Compute per-score stats and find best values
    const maxFilterByMapID = new Map<number, {
        score: number;
        average: number;
        relMax: number;
        percentMax: number;
        relAvg: number;
        percentAvg: number;
        zScore: number;
    }>();
    scoreViews.forEach(scoreView => {
        scoreView.scores.forEach(s => {
            if (s.score === 0)
                return;

            const mapsStats = statsByMapID.get(s.mapID)!;
            const mapMax = maxFilterByMapID.get(s.mapID) ?? { score: 0, average: 0, relMax: 0, percentMax: 0, relAvg: 0, percentAvg: 0, zScore: 0 };

            const targetScore = syncView === "players" ? s.average : s.score;

            s.relMax = targetScore / (mapsStats.max || 1);
            s.percentMax = Math.round(s.relMax * 100);

            s.relAvg = targetScore / (mapsStats.avg || 1);
            s.percentAvg = Math.round(s.relAvg * 100);

            s.zScore = (targetScore - mapsStats.avg) / (mapsStats.stdDev || 1);

            mapMax.score = Math.max(mapMax.score, s.score);
            mapMax.average = Math.max(mapMax.average, s.average);
            mapMax.relMax = Math.max(mapMax.relMax, s.relMax);
            mapMax.percentMax = Math.max(mapMax.percentMax, s.percentMax);
            mapMax.relAvg = Math.max(mapMax.relAvg, s.relAvg);
            mapMax.percentAvg = Math.max(mapMax.percentAvg, s.percentAvg);
            mapMax.zScore = Math.max(mapMax.zScore, s.zScore);
            maxFilterByMapID.set(s.mapID, mapMax);
        });

        const nonZeroScores = scoreView.scores.filter(score => score.score !== 0);
        scoreView.relMax = nonZeroScores.reduce((a, b) => a + b.relMax, 0);
        scoreView.percentMax = Math.round(nonZeroScores.reduce((a, b) => a + b.percentMax, 0) / (nonZeroScores.length || 1));
        scoreView.relAvg = nonZeroScores.reduce((a, b) => a + b.relAvg, 0);
        scoreView.percentAvg = Math.round(nonZeroScores.reduce((a, b) => a + b.percentAvg, 0) / (nonZeroScores.length || 1));
        scoreView.zScore = nonZeroScores.reduce((a, b) => a + b.zScore, 0);
    });

    // Sort by current filter
    scoreViews.sort((a, b) => {
        if (mapSort !== -1 && a.scores[mapSort])
            return sortDir === "asc" ? a.scores[mapSort][currentFilter] - b.scores[mapSort][currentFilter] : b.scores[mapSort][currentFilter] - a.scores[mapSort][currentFilter];

        return sortDir === "asc" ? a[currentFilter] - b[currentFilter] : b[currentFilter] - a[currentFilter];
    });

    // Add best/worst values, and placement
    scoreViews.forEach(scoreView => {
        scoreView.scores.forEach(s => {
            const score = maxFilterByMapID.get(s.mapID);
            if (score && s[currentFilter] === score[currentFilter as keyof typeof score])
                s.isBest = true;
        });
        scoreView.truePlacement = scoreViews.filter(s => s.zScore > scoreView.zScore).length + 1;
        if (mapSort !== -1 && scoreView.scores[mapSort])
            scoreView.sortPlacement = scoreViews.filter(s => s.scores[mapSort][currentFilter] > scoreView.scores[mapSort][currentFilter]).length + 1;
        else
            scoreView.sortPlacement = scoreViews.filter(s => s[currentFilter] > scoreView[currentFilter]).length + 1;
        scoreView.best = scoreView.scores.reduce((a, b) => a[currentFilter] > b[currentFilter] ? a : b).map,
        scoreView.worst = scoreView.scores.filter(score => score.score !== 0).reduce((a, b) => a[currentFilter] < b[currentFilter] ? a : b).map;
    });

    return scoreViews;
}
