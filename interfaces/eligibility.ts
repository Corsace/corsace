import { User } from "./user";

export interface Eligibility {
    ID: number;
    year: number;
    standard: boolean;
    taiko: boolean;
    fruits: boolean;
    mania: boolean;
    storyboard: boolean;
    user: User;
}
