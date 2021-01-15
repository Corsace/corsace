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
