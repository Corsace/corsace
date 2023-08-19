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
    baseURL?:           string | null;
    round?:             Round | null;
    stage?:             Stage | null;
    isLowerBracket:     boolean;
    teams?:             Team[] | null;
    team1?:             Team | null;
    team2?:             Team | null;
    team1Score:         number;
    team2Score:         number;
    first?:             Team | null;
    winner?:            Team | null;
    maps?:              MatchupMap[] | null;
    mappoolsBanned?:    Mappool[] | null;
    potential:          boolean;
    forfeit:            boolean;
    referee?:           User | null;
    streamer?:          User | null;
    commentators?:      User[] | null;
    messages?:          MatchupMessage[] | null;
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

export interface MatchupScoreView {
    ID: number;
    name: string;
    team?: string;
    teamID?: number;
    avatar?: string | null;
    scores: {
        map: string;
        mapID: number;
        sum: number;
        average: number;
        relMax: number;
        percentMax: number;
        relAvg: number;
        percentAvg: number;
        zScore: number;
        isBest: boolean;
    }[];
    best: string;
    worst: string;
    sum: number;
    average: number;
    relMax: number;
    percentMax: number;
    relAvg: number;
    percentAvg: number;
    zScore: number;
    placement: number;
}

export const scoreFilters = ["zScore", "relMax", "percentMax", "relAvg", "percentAvg", "sum", "average"];

export type scoreSortType = typeof scoreFilters[number];

export function mapNames (scores: MatchupScore[] | null): {
    map: string;
    mapID: number;
}[] {
    if (!scores)
        return [];

    const mapNames = scores
        .map(s => ({
            map: s.map,
            mapID: s.mapID,
        }))
        .filter((v, i, a) => a.findIndex(t => (t.map === v.map && t.mapID === v.mapID)) === i);

    mapNames.sort((a, b) => a.mapID - b.mapID);
    return mapNames;
}

export function computeScoreViews (
    idNameAccessor: (score: MatchupScore) => { id: number, name: string, avatar?: string | null }, 
    scores: MatchupScore[] | null, 
    syncView: "players" | "teams",
    currentFilter: scoreSortType,
    mapSort: number,
    sortDir: "asc" | "desc"
): MatchupScoreView[] {
    if (!scores)
        return [];

    const scoreViews: MatchupScoreView[] = [];
    const idNames = scores.map(idNameAccessor).filter((v, i, a) => a.findIndex(t => (t.id === v.id && t.name === v.name)) === i);
    const mapNameList = mapNames(scores);

    const scoresByAccessorID = new Map<number, MatchupScore[]>();
    const scoresByMapID = new Map<number, number[]>();
    for (const score of scores) {
        const userID = idNameAccessor(score).id;
        const scores = scoresByAccessorID.get(userID) || [];
        scores.push(score);
        scoresByAccessorID.set(userID, scores);
    }

    // Create score objects for each player
    for (const idName of idNames) {
        const scores = scoresByAccessorID.get(idName.id)!;
        const nonZeroScores = scores.filter(score => score.score !== 0);
        if (nonZeroScores.length === 0)
            continue;

        const scoreView: MatchupScoreView = {
            ID: idName.id,
            name: idName.name,
            avatar: idName.avatar,
            scores: mapNameList.map(map => {
                const mapScores = scores.filter(score => score.mapID === map.mapID);
                const score = mapScores.reduce((a, b) => a + b.score, 0);
                const avgScore = Math.round(score / (mapScores.length || 1));

                const mapID = map.mapID;
                const mapScoreHash = scoresByMapID.get(mapID) || [];
                mapScoreHash.push(score);
                scoresByMapID.set(mapID, mapScoreHash);

                return {
                    map: map.map,
                    mapID: map.mapID,
                    sum: score,
                    average: avgScore,
                    relMax: -100,
                    percentMax: -100,
                    relAvg: -100,
                    percentAvg: -100,
                    zScore: -100,
                    isBest: false,
                };
            }),
            best: "",
            worst: "",
            sum: scores.reduce((a, b) => a + b.score, 0),
            average: Math.round(nonZeroScores.reduce((a, b) => a + b.score, 0) / (nonZeroScores.length || 1)),
            relMax: -100,
            percentMax: -100,
            relAvg: -100,
            percentAvg: -100,
            zScore: -100,
            placement: -1,
        };
        scoreView.scores.sort((a, b) => a.mapID - b.mapID);

        if (syncView === "players") {
            const team = scores.find(s => s.userID === idName.id);
            if (team) {
                scoreView.team = team.teamName;
                scoreView.teamID = team.teamID;
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
        const scores = scoresByMapID.get(mapID)!;
        const max = Math.max(...scores);
        const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
        const stdDev = Math.sqrt(scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / (scores.length || 1));
        statsByMapID.set(mapID, { max, avg, stdDev });
    }

    // Compute per-score stats and find best values
    const maxFilterByMapID = new Map<number, {
        sum: number;
        average: number;
        relMax: number;
        percentMax: number;
        relAvg: number;
        percentAvg: number;
        zScore: number;
    }>();
    scoreViews.forEach(score => {
        score.scores.forEach(s => {
            if (s.sum === 0)
                return;

            const mapsStats = statsByMapID.get(s.mapID)!;
            const mapMax = maxFilterByMapID.get(s.mapID) || { sum: 0, average: 0, relMax: 0, percentMax: 0, relAvg: 0, percentAvg: 0, zScore: 0 };

            s.relMax = s.sum / (mapsStats.max || 1);
            s.percentMax = Math.round(s.relMax * 100);

            s.relAvg = s.sum / (mapsStats.avg || 1);
            s.percentAvg = Math.round(s.relAvg * 100);

            s.zScore = (s.sum - mapsStats.avg) / (mapsStats.stdDev || 1);
            
            mapMax.sum = Math.max(mapMax.sum, s.sum);
            mapMax.average = Math.max(mapMax.average, s.average);
            mapMax.relMax = Math.max(mapMax.relMax, s.relMax);
            mapMax.percentMax = Math.max(mapMax.percentMax, s.percentMax);
            mapMax.relAvg = Math.max(mapMax.relAvg, s.relAvg);
            mapMax.percentAvg = Math.max(mapMax.percentAvg, s.percentAvg);
            mapMax.zScore = Math.max(mapMax.zScore, s.zScore);
            maxFilterByMapID.set(s.mapID, mapMax);
        });

        const nonZeroScores = score.scores.filter(score => score.sum !== 0);
        score.relMax = nonZeroScores.reduce((a, b) => a + b.relMax, 0);
        score.percentMax = Math.round(nonZeroScores.reduce((a, b) => a + b.percentMax, 0) / (nonZeroScores.length || 1));
        score.relAvg = nonZeroScores.reduce((a, b) => a + b.relAvg, 0);
        score.percentAvg = Math.round(nonZeroScores.reduce((a, b) => a + b.percentAvg, 0) / (nonZeroScores.length || 1));
        score.zScore = nonZeroScores.reduce((a, b) => a + b.zScore, 0);    
    });

    // Add best/worst values, and placement
    scoreViews.forEach(score => {
        score.scores.forEach(s => {
            if (s[currentFilter] === maxFilterByMapID.get(s.mapID)?.[currentFilter])
                s.isBest = true;
        });
        score.placement = scoreViews.filter(s => s.zScore > score.zScore).length + 1;
        score.best = score.scores.reduce((a, b) => a[currentFilter] > b[currentFilter] ? a : b).map,
        score.worst = score.scores.filter(score => score.sum !== 0).reduce((a, b) => a[currentFilter] < b[currentFilter] ? a : b).map;
    });

    // Sort by current filter
    scoreViews.sort((a, b) => {
        if (mapSort !== -1 && a.scores[mapSort])
            return sortDir === "asc" ? a.scores[mapSort][currentFilter] - b.scores[mapSort][currentFilter] : b.scores[mapSort][currentFilter] - a.scores[mapSort][currentFilter];

        return sortDir === "asc" ? a[currentFilter] - b[currentFilter] : b[currentFilter] - a[currentFilter];
    });

    return scoreViews;
}