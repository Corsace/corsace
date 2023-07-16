import { Mode } from "./modes";

export const scopes = ["identify", "public", "friends.read"];

/* eslint-disable no-useless-escape */
const bwsFilterString = `fanart|fan\sart|idol|voice|nominator|nominating|mapper|mapping|moderation|moderating|community|contributor|contribution|contribute|organize|organizing|pending|spotlights|aspire|newspaper|jabc|omc`;

export const bwsFilter = {
    1: new RegExp(`${bwsFilterString}|taiko|catch|ctb|fruits|mania`, "gi"),
    2: new RegExp(`${bwsFilterString}|catch|ctb|fruits|mania`, "gi"),
    3: new RegExp(`${bwsFilterString}|taiko|mania`, "gi"),
    4: new RegExp(`${bwsFilterString}|taiko|catch|ctb|fruits`, "gi"),
};

export const modeName = {
    1: "osu",
    2: "taiko",
    3: "fruits",
    4: "mania",
};

export interface osuAPIV2ChatBotOptions {
    disableRateLimiting: boolean;
    requestsPerMinute: number;
    baseURL: string;
}

export interface osuAPIV2ChatBotToken {
    token: string;
    expiresAt: Date;
}

export interface osuV2Token {
    token_type: string;
    expires_in: number;
    access_token: string;
    refresh_token?: string;
}

// All interfaces/types below can be expanded upon as needed for the project to work.
// What is there currently are only the properties that are used or needed.
export interface osuV2UserStatistics {
    pp: number;
    global_rank: number | null;
}

export interface osuV2UserBadge {
    description: string;
    image_url: string;
}

export interface osuV2UserGroup {
    id: number;
    playmodes: Mode[];
}

export interface osuV2User {
    id: number;
    username: string;
    playmode: Mode;
    country_code: string;
    avatar_url: string;
    previous_usernames: string[];
    statistics: osuV2UserStatistics;
    statistics_rulesets: {
        "osu": osuV2UserStatistics;
        "taiko": osuV2UserStatistics;
        "fruits": osuV2UserStatistics;
        "mania": osuV2UserStatistics;
    }
    badges: osuV2UserBadge[];
    groups: osuV2UserGroup[];
}

export interface osuV2Friend {
    id: number;
}

export interface osuV2Beatmapset {
    id: number;
    beatmaps: osuV2Beatmap[];
}

export interface osuV2Beatmap {
    id: number;
}

export interface osuV2PlayedBeatmaps {
    beatmapsets: osuV2Beatmapset[];
    cursor_string: string;
    total: number;

}