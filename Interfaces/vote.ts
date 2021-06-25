import { Beatmapset } from "./beatmap";
import { Category } from "./category";
import { User } from "./user";

export interface Vote {
    ID: number;
    voter: User;
    category: Category;
    userID?: number;
    user?: User;
    beatmapsetID?: number;
    beatmapset?: Beatmapset;
    choice: number;
}

export interface StaffVote {
    ID: number;
    category: number;
    choice: number;
    voter: {
        osuID: string;
        osuUsername: string;
        discordUsername: string;
    }
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
