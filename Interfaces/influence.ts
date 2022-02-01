import { User } from "./user";

export interface Influence {
    ID: number;
    year: number;
    rank: number;
    comment?: string;
    influence: User;
}
