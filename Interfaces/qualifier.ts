import { TeamInfo } from "./team";
import { User } from "../Models/user";
import { MatchPlayInfo } from "./match";

export interface QualifierInfo {
    ID: number;
    teams?: TeamInfo[];
    scores?: MatchPlayInfo[];
    time: Date;
    mp?: number;
    referee?: User;
    public: boolean;
}
