import { Category } from "./category";

interface InternalPhase {
    start: Date;
    end: Date;
}

export interface MCA {
    year: number;
    nomination: InternalPhase;
    voting: InternalPhase;
    results: Date;
}

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
