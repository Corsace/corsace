import { TeamInfo } from "./team"

export interface TeamInviteInfo {
    osuUserID: number;
    osuUsername: string;
    team: number | TeamInfo;
    status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
    dateCreated: Date;
    lastUpdate: Date;
}