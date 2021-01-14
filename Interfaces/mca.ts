import { Category } from "./category";

export interface MCAInfo {
    name: number;
    nomination: {
        start: Date,
        end: Date,
    };
    voting: {
        start: Date,
        end: Date,
    };
    results: Date;
    categories: Category[];
}

export interface Phase {
    phase: string;
    startDate: Date;
    endDate: Date;
    year: number;
}
