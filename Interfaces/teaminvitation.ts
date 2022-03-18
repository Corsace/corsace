import { RequestStatus } from "./guestRequests";
import { TeamInfo } from "./team";
import { UserInfo } from "./user";

export interface TeamInvitationInfo {
    ID: number;
    target: UserInfo;
    team: TeamInfo;
    status: RequestStatus;
    dateCreated: Date;
    lastUpdate: Date;
}
