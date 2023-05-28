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
    phase: PhaseType;
    nomination: InternalPhase;
    voting: InternalPhase;
    results: Date;
    categories: Category[];
}

export type StageType = "nominating" | "voting" | "results";
export type PhaseType = StageType | "preparation";

export interface Phase {
    phase: PhaseType;
    startDate: Date;
    endDate: Date;
    year: number;
}
