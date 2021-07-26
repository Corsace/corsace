import { TeamInfo } from "./team"
import { UserOpenInfo } from "./user"
export interface QualifierLobby {
    id: number
    time: Date
    teams: TeamInfo[]
    referee: UserOpenInfo | null
    public: boolean
    

}