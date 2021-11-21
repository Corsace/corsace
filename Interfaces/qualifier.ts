import { TeamInfo } from "./team";
import { User } from "../Models/user";

export interface QualifierPlayInfo extends MatchPlayInfo {
    mapID: number;
    team?: string;
    score: number;
    userOsuID: number;
}

export interface QualifierInfo {
    ID: number;
    teams?: TeamInfo[];
    scores?: QualifierPlayInfo[];
    time: Date;
    mp?: number;
    referee?: User;
    public: boolean;
}
