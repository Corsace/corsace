import { Beatmap } from "./beatmap";
import { MCA } from "./mca";
import { ModeDivision } from "./modes";
import { RequestStatus } from "./requestStatus";
import { User } from "./user";

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
