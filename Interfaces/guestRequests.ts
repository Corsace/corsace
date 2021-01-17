import { Beatmap } from "./beatmap";
import { MCA } from "./mca";
import { ModeDivision } from "./modes";
import { User } from "./user";

export enum RequestStatus {
    Pending,
    Accepted,
    Rejected
}

export interface GuestRequest {
    ID: number,
    mca: MCA,
    mode: ModeDivision,
    status: RequestStatus,
    user: User,
    beatmap: Beatmap,
}
