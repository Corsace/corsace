import { ScoreInfo } from "./score"
import { TeamInfo } from "./team"
import { UserOpenInfo } from "./user"
import { MappoolInfo } from "./mappool"

export interface QualifierInfo {
    scores: ScoreInfo[]
    id: Number
    time: Date
    teams: TeamInfo[]
    public: Boolean
    referee: UserOpenInfo
    mappool: MappoolInfo
}