import { UserOpenInfo } from "./user";

export interface TeamInfo {
    id: Number
    name: String
    captain: Number
    averagePp: number
    teamAvatarUrl: String
    slug: String
    averageBWS: Number
    seed: "A" | "B" | "C" | "D" | null;
    rank: Number
    members: UserOpenInfo[] 
}




export const nameFilter = /(nigg|fa?gg?o?t|retard|coon|pedo|gay|lesbian|fuck|sex|penis|vag)/i;
