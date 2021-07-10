import { Beatmapset } from "./beatmap";
import { Category } from "./category";
import { User } from "./user";

export interface Nomination {
    ID: number;
    nominator: User;
    category: Category;
    user?: User;
    beatmapset?: Beatmapset;
    isValid: boolean;
    reviewer: User;
    lastReviewedAt: Date;
}

export interface StaffNomination {
    ID: number;
    categoryId: number;
    isValid: boolean;
    reviewer: string;
    lastReviewedAt: Date;
    nominators: {
        osuID: string;
        osuUsername: string;
        discordUsername: string;
    }[]
    user?: {
        osuID: string;
        osuUsername: string;
        discordUsername: string;
    }
    beatmapset?: {
        ID: number;
        artist: string;
        title: string;
        tags: string;
        BPM: number;
        length: number;
        maxSR: number;
        creator: {
            osuID: string;
            osuUsername: string;
            discordUsername: string;
        }
    }
}