import { profanityFilterStrong } from "./comment";
import { Match } from "./match";

export interface BaseTeam {
    ID: number;
    name: string;
}

export interface Team extends BaseTeam {
    abbreviation: string;
    avatarURL?: string;
    rank: number;
    BWS: number;
    manager: TeamMember;
    members: TeamMember[];
    invites?: TeamUser[];
    qualifier?: Match;
}

export interface TeamUser {
    ID: number;
    username: string;
    osuID: string;
}

export interface TeamMember extends TeamUser {
    isManager: boolean;
    BWS: number;
}

// TODO: Add TeamInvite interface as needed
// export interface TeamInvite extends TeamUser {}

export function validateTeamText (name: string, abbreviation: string): { name: string, abbreviation: string } | { error: string } {
    if (/^team /i.test(name)) {
        name = name.replace(/^team /i, "");
        if (/^t/i.test(abbreviation))
            abbreviation = abbreviation.replace(/^t/i, "");
    }

    if (name.length > 20 || name.length < 5 || profanityFilterStrong.test(name) || /[^\w\s]/i.test(name))
        return { error: "Team name is invalid. Ensure the team name is between 5 and 20 characters and does not contain any profanity." };

    if (abbreviation.length > 4 || abbreviation.length < 2 || profanityFilterStrong.test(abbreviation) || /[^\w]/i.test(abbreviation))
        return { error: "Team abbreviation is invalid. Ensure the team abbreviation is between 2 and 4 characters and does not contain any profanity." };

    return { name, abbreviation };
}