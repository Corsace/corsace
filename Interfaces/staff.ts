import { TournamentRoleType } from "./tournament";

export interface StaffMember {
    username: string;
    avatar: string;
    loggedIn: boolean;

    ID?: number;
    osuID?: string;
    country?: string;
}

export interface StaffList {
    role: string;
    roleType: TournamentRoleType;
    users: StaffMember[];
}