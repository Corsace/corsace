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

export interface CategoryCondensedInfo {
    name: string;
    type: string;
    mode: string;
}

export interface CategoryInfo extends CategoryCondensedInfo {
    id: number;
    maxNominations: number;

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
    filter?: CategoryFilter;
    type: CategoryType;
    mode: ModeDivision;
}

export enum CategoryType {
    Beatmapsets = 0,
    Users = 1,
}
