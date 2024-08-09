import { TournamentRoleType } from "./tournament";

export interface BaseStaffMember {
    ID: number;
    username: string;
}

export interface StaffMember extends Partial<BaseStaffMember> {
    username: string;
    avatar: string;
    loggedIn: boolean;

    osuID?: string;
    country?: string;
}

export interface StaffList {
    role: string;
    roleType: TournamentRoleType;
    users: StaffMember[];
}

export interface OpenStaffInfoList {
    role: string;
    roleType: TournamentRoleType;
    users: BaseStaffMember[];
}

export interface OpenStaffInfo {
    staff: OpenStaffInfoList[];
    userRoles: TournamentRoleType[];
}