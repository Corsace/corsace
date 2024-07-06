import { profanityFilterStrong } from "./comment";
import { BaseMatchup } from "./matchup";
import { BaseTournament } from "./tournament";

export interface BaseTeam {
    ID: number;
    name: string;
    avatarURL?: string | null;
}

export interface TeamList extends BaseTeam {
    pp: number;
    rank: number;
    BWS: number;
    members: TeamMember[];
}

export interface Team extends TeamList {
    abbreviation: string;
    timezoneOffset: number;
    captain: TeamMember;
    invites?: TeamUser[];
    qualifier?: BaseMatchup;
    tournaments?: BaseTournament[];
}

export interface TeamUser {
    ID: number;
    username: string;
    osuID: string;
}

export interface TeamMember extends TeamUser {
    isCaptain: boolean;
    country: string;
    rank: number;
}

export interface TeamInvites {
    teamID: number;
    invites: TeamUser[];
}

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