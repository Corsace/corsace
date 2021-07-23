import { Beatmapset } from "./beatmap";
import { Eligibility } from "./eligibility";
import { GuestRequest } from "./requests";
import { TeamInfo } from "./team";
import { Style } from "util";

export interface UserMCAInfo extends UserInfo {
    guestRequests: GuestRequest[];
    eligibility: Eligibility[];
    mcaStaff: {
        standard: boolean;
        taiko: boolean;
        fruits: boolean;
        mania: boolean;
        storyboard: boolean;
    }
}
export interface UserOpenInfo extends UserInfo {
    team: TeamInfo | null;
    pickemPoints: number;
    rank: number;
    badges: number;
    pp: number;

    openStaff: {
        isMappooler: boolean;
        isReferee: boolean;
        isScheduler: boolean;
    }

    //These fields are only used in QualifierScoresTable
    //todo: make a local interface for that component and delete these
    teamSlug?: string;
    teamName?: string;
    style?: Record<string, any>;
    teamStyle?: Record<string, any>;
    best?: string;
    worst?: string;
    average?: number;
    count?: number;
    qualifier?: number | null; //check this
    time?: Date;

    
}

export interface UserInfo {
    corsaceID: number;
    discord: {
        avatar: string;
        userID: string;
        username: string;
    };
    osu: {
        avatar: string;
        userID: string;
        username: string;
        otherNames: string[];
    };
    staff: {
        corsace: boolean;
        headStaff: boolean;
        staff: boolean;
    };
    joinDate: Date;
    lastLogin: Date;
    canComment: boolean;
}

export interface UserChoiceInfo {
    corsaceID: number;
    username: string;
    avatar: string;
    userID: string;
    otherNames: string[];
    chosen: boolean;
}

export interface User {
    ID: number;
    discord: OAuth;
    osu: OAuth;
    registered: Date;
    lastLogin: Date;
    mcaEligibility: Eligibility[];
    beatmapsets: Beatmapset[];
    canComment: boolean;
}

export interface OAuth {
    userID: string;
    username: string;
    avatar: string;
    dateAdded: Date;
    lastVerified: Date;
}

