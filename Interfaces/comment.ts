import { ModeDivision } from "./modes";
import { User } from "./user";

export const profanityFilter = /(n(i|1)g|f(4|a)?gg?(0|o)?t|f(4|a)g|r(3|e)t(4|a)rd|c(0|o)(0|o)n|p(3|e)d(0|o)|g(a|4)y|l(3|e)sb(1|i)(a|4)n|fuck|s(3|e)x|p(3|e)n(1|i)s|c(0|o)ck|cum|v(4|a)g)|c(4|a)nc(e|3)r/i;

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