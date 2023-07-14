export interface Team {
    ID: number;
    name: string;
    abbreviation: string;
    avatarURL?: string;
    rank: number;
    BWS: number;
    manager: TeamMember;
    members: TeamMember[];
    invites?: TeamUser[];
}

interface TeamUser {
    ID: number;
    username: string;
    osuID: string;
    BWS: number;
}

export interface TeamMember extends TeamUser {
    isManager: boolean;
}

// TODO: Add TeamInvite interface as needed
// export interface TeamInvite extends TeamUser {}
