import { Beatmap } from "./beatmap";
import { MCA } from "./mca";
import { ModeDivision } from "./modes";
import { User } from "./user";

export enum RequestStatus {
    Pending,
    Accepted,
    Rejected,
    Cancelled,
}

export interface GuestRequest {
    ID: number;
    mca: MCA;
    mode: ModeDivision;
    status: RequestStatus;
    user: User;
    beatmap: Beatmap;
}

export interface StaffGuestRequest {
    ID: number;
    status: RequestStatus;
    userID: string;
    username: string;
    beatmapID: number;
    modeName: string;
}

export interface TeamRequest {
    status: RequestStatus;
}