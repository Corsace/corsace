import { Phase } from "./phase";
import { Stage } from "./stage";
import { UserInfo } from "./user";

export interface Tournament {
    ID:               number;
    createdAt:        Date;
    organizer:        UserInfo;
    name:             string;
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
    mapTimer:         null;
    readyTimer:       null;
    abortThreshold:   null;
    teamAbortLimit:   number;
    stages:           Stage[];
    registrations:    Phase;
    teams:            any[];
    publicQualifiers: boolean;
    status:           number;
}