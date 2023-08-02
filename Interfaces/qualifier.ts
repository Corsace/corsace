export interface BaseQualifier {
    ID: number;
    date: Date;
    team?: QualifierTeam;
}

export interface Qualifier extends BaseQualifier {
    scores: QualifierScore[];
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

export interface QualifierScore {
    teamID: number;
    teamName: string;
    username: string;
    userID: number;
    score: number;
    map: string;
    mapID: number;
}

export interface QualifierScoreView {
    ID: number;
    name: string;
    team?: string;
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