import { Category, CategoryCondensedInfo, CategoryStageInfo } from "./category";
import { ModeDivisionType } from "./modes";
import { Nomination } from "./nomination";
import { Phase } from "./phase";
import { Vote } from "./vote";

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

export type MCAFrontData = Record<keyof typeof ModeDivisionType, {
    categoryInfos: CategoryCondensedInfo[];
    beatmapCount: number;
    organizers: string[];
} | undefined>;

export type MCAStageData = {
    categories: CategoryStageInfo[];
} & (
    {
        nominations: Nomination[];
    } |
    {
        votes: Vote[]
    }
)

export type StageType = "nominating" | "voting" | "results";
export type PhaseType = StageType | "preparation";

export interface MCAPhase {
    phase: PhaseType;
    startDate: Date;
    endDate: Date;
    year: number;
}
