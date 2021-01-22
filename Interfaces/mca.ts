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
    nomination: InternalPhase;
    voting: InternalPhase;
    results: Date;
    categories: Category[];
}

export interface Phase {
    phase: "nominating" | "voting" | "results";
    startDate: Date;
    endDate: Date;
    year: number;
}
