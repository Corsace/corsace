import { ScoreInfo } from "./score"
import { TeamInfo } from "./team"
import { UserOpenInfo } from "./user"
import { MappoolInfo } from "./mappool"

export interface QualifierInfo {
    id: number
    time: Date
    public: boolean
    referee: UserOpenInfo
    mappool: MappoolInfo
    qualifiers: QualifierLobby[]
    scores: ScoreInfo[]

}

export interface QualifierLobby {
    id: number
    time: Date
    teams: TeamInfo[]
    

}