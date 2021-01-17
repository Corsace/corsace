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
