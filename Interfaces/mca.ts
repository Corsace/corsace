import { Category } from "./category";
import { Phase } from "./phase";

export interface MCA {
    year: number;
    nomination: Phase;
    voting: Phase;
    results: Date;
}

export interface MCAInfo {
    name: number;
    phase: PhaseType;
    nomination: Phase;
    voting: Phase;
    results: Date;
    categories: Category[];
}

export type StageType = "nominating" | "voting" | "results";
export type PhaseType = StageType | "preparation";

export interface MCAPhase {
    phase: PhaseType;
    startDate: Date;
    endDate: Date;
    year: number;
}
