import { ModeDivision } from "./modes";

export interface CategoryFilter {
    minLength?: number;
    maxLength?: number;
    minBPM?: number;
    maxBPM?: number;
    minSR?: number;
    maxSR?: number;
    minCS?: number;
    maxCS?: number;
    rookie?: boolean;
}

export interface CategoryInfo {
    id: number;
    name: string;
    maxNominations: number;
    requiresVetting: boolean;
    type: string;
    mode: string;

    isFiltered: boolean;
    filter?: CategoryFilter;
}

export interface CategoryStageInfo extends CategoryInfo {
    count: number;
}

export interface Category {
    ID: number;
    name: string;
    maxNominations: number;
    requiresVetting: boolean;
    filter?: CategoryFilter;
    type: CategoryType;
    mode: ModeDivision;
}

export enum CategoryType {
    Beatmapsets = 0,
    Users = 1,
}
