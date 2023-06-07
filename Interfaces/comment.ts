import { ModeDivision } from "./modes";
import { User } from "./user";

const profanityFilterString = "(n(i|1)g|f(4|a)?gg?(0|o)?t|f(4|a)g|r(3|e)t(4|a)rd|c(0|o)(0|o)n|p(3|e)d(0|o)|p(3|e)n(1|i)s|c(0|o)ck|cum|v(4|a)g)|c(4|a)nc(e|3)r|kys"; 

export const profanityFilter = new RegExp(`${profanityFilterString}`, "gi");

export const profanityFilterStrong = new RegExp(`${profanityFilterString}|fuck|sh(i|1)t|p(i|1)ss|(4|a)ss`, "gi");

export interface Comment {
    ID: number;
    comment: string;
    year: number;
    isValid: boolean;
    mode: ModeDivision;
    commenterID: number;
    commenter: User;
    target: User;
    reviewer?: User;
    lastReviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface StaffComment {
    ID: number;
    comment: string;
    isValid: boolean;
    mode: string;
    commenter: {
        ID: number;
        osuID: string;
        osuUsername: string;
    }
    target: {
        osuID: string;
        osuUsername: string;
    }
    reviewer?: string;
    lastReviewedAt?: Date;

}