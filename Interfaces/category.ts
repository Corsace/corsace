import { ModeDivision } from "./modes";

export interface CategoryFilter {
    minLength?: number | null;
    maxLength?: number | null;
    minBPM?: number | null;
    maxBPM?: number | null;
    minSR?: number | null;
    maxSR?: number | null;
    minCS?: number | null;
    maxCS?: number | null;
    topOnly?: boolean;
    rookie?: boolean | null;
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
export type SectionCategory = "beatmaps" | "users" | "";
