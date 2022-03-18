import { TeamInfo } from "./team";
import { MatchPlayInfo } from "./match";
import { UserInfo } from "./user";

export interface QualifierInfo {
    ID: number;
    teams?: TeamInfo[];
    scores?: MatchPlayInfo[];
    time: Date;
    mp?: number;
    referee?: UserInfo;
    public: boolean;
}
