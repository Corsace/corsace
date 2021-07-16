import { ScoreInfo } from "./score"
import { TeamInfo } from "./team"

export interface QualifierInfo {
    scores: ScoreInfo[]
    id: Number
    time: Date
    teams: TeamInfo[]
    public: boolean
}