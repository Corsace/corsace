export interface BaseQualifier {
    ID: number;
    date: Date;
    team?: {
        name: string;
        avatarURL?: string | null;
    };
}

export interface QualifierScore {
    teamID: number;
    teamName: string;
    username: string;
    userID: number;
    score: number;
    map: string;
}

export interface QualifierScoreView {
    ID: number;
    name: string;
    scores: {
        map: string;
        score: number;
        isBest: boolean;
    }[];
    best: string;
    worst: string;
    average: number;
}