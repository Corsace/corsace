import { GuildForumTagData } from "discord.js";
import { Phase } from "./phase";
import { Stage } from "./stage";
import { UserInfo } from "./user";

export interface BaseTournament {
    ID: number;
    name: string;
}

export interface Tournament extends BaseTournament {
    createdAt:        Date;
    organizer:        UserInfo;
    abbreviation:     string;
    description:      string;
    server:           string;
    year:             number;
    matchupSize:      number;
    regSortOrder:     number;
    isOpen:           boolean;
    isClosed:         boolean;
    invitational:     boolean;
    minTeamSize:      number;
    maxTeamSize:      number;
    warmups:          boolean;
    mapTimer:         number | null;
    readyTimer:       number | null;
    abortThreshold:   number | null;
    teamAbortLimit:   number;
    stages:           Stage[];
    registrations:    Phase;
    teams:            any[];
    status:           number;
}

export enum TournamentRoleType {
    Organizer,
    Participants,
    Captains,
    Mappoolers,
    Mappers,
    Testplayers,
    Referees,
    Streamers,
    Commentators,
    Staff,
    Designer,
    Developer,
}

export const unallowedToPlay = [
    TournamentRoleType.Organizer,
    TournamentRoleType.Mappoolers,
    TournamentRoleType.Mappers,
    TournamentRoleType.Testplayers,
    TournamentRoleType.Referees,
];

export const canViewPrivateMappools = [
    TournamentRoleType.Organizer,
    TournamentRoleType.Mappoolers,
    TournamentRoleType.Mappers,
    TournamentRoleType.Testplayers,
];

export const playingRoles = [
    TournamentRoleType.Participants,
    TournamentRoleType.Captains,
];

export const tournamentStaffRoleOrder = [
    TournamentRoleType.Organizer,
    TournamentRoleType.Designer,
    TournamentRoleType.Developer,
    TournamentRoleType.Referees,
    TournamentRoleType.Streamers,
    TournamentRoleType.Commentators,
    TournamentRoleType.Mappoolers,
    TournamentRoleType.Mappers,
    TournamentRoleType.Testplayers,
    TournamentRoleType.Staff,
];

export enum TournamentChannelType {
    General,
    Participants,
    Captains,
    Announcements,
    Admin,
    Mappool,
    Mappoollog,
    Mappoolqa,
    Testplayers,
    Referee,
    Stream,
    Matchupresults,
    Jobboard,
    Staff,
    Streamannouncements,
    Rescheduling,
}

// Designate an array of TournamentRoles for each channel type
// Having this as a function instead of a constant avoids possible circular dependencies and undefined errors on instance startup
export function getTournamentChannelTypeRoles () {
    return {
        [TournamentChannelType.General]: undefined,
        [TournamentChannelType.Participants]: Object.values(TournamentRoleType).filter((role) => typeof role === "number") as TournamentRoleType[],
        [TournamentChannelType.Captains]: Object.values(TournamentRoleType).filter((role) => typeof role === "number" && role !== TournamentRoleType.Participants) as TournamentRoleType[],
        [TournamentChannelType.Announcements]: undefined,
        [TournamentChannelType.Admin]: [TournamentRoleType.Organizer],
        [TournamentChannelType.Mappool]: [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers],
        [TournamentChannelType.Mappoollog]: [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers],
        [TournamentChannelType.Mappoolqa]: [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers],
        [TournamentChannelType.Testplayers]: [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers],
        [TournamentChannelType.Referee]: [TournamentRoleType.Organizer, TournamentRoleType.Referees],
        [TournamentChannelType.Stream]: [TournamentRoleType.Organizer, TournamentRoleType.Referees, TournamentRoleType.Streamers, TournamentRoleType.Commentators],
        [TournamentChannelType.Matchupresults]: undefined,
        [TournamentChannelType.Jobboard]: [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers],
        [TournamentChannelType.Staff]: [TournamentRoleType.Staff],
        [TournamentChannelType.Streamannouncements]: undefined,
    } as { [key in TournamentChannelType]: TournamentRoleType[] | undefined };
}

// Having this as a function instead of a constant avoids possible circular dependencies and undefined errors on instance startup
export function forumTags () {
    return {
        [TournamentChannelType.Mappoolqa]: [
            { name: "WIP", moderated: true },
            { name: "Finished", moderated: true },
            { name: "Late", moderated: true },
            { name: "Needs HS", moderated: true },
        ],
        [TournamentChannelType.Jobboard]: [
            { name: "Open", moderated: true },
            { name: "Closed", moderated: true },
            { name: "To Assign", moderated: true },
        ],
    } as { [key in TournamentChannelType]?: GuildForumTagData[] };
}
