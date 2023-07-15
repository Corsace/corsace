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
    publicQualifiers: boolean;
    status:           number;
}