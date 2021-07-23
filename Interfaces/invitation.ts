import { TeamInfo } from "./team"

export interface Invitation {
    team: TeamInfo
    _id: number
    osuUsername: string
}