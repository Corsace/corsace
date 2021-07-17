import { ScoreInfo } from "./score"
import { TeamInfo } from "./team"
import { UserOpenInfo } from "./user"
import { MappoolInfo } from "./mappool"

export interface QualifierInfo {
    id: Number
    time: Date
    public: Boolean
    referee: UserOpenInfo
    mappool: MappoolInfo
    qualifiers: QualifierLobby[]
}

export interface QualifierLobby {
    scores: ScoreInfo[]
    id: Number
    time: Date
    teams: TeamInfo[]

}