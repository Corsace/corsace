import { ModeDivision } from "./modes";
import { User } from "./user";

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
