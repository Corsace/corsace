import { ModeDivision } from "./modes";
import { User } from "./user";

export interface Beatmapset {
    ID: number;
    artist: string;
    title: string;
    submitDate: Date;
    approvedDate: Date;
    BPM: number;
    genre: string;
    language: string;
    favourites: number;
    tags: string;
    creator?: User;
}

export interface Beatmap {
    ID: number;
    beatmapsetID: number;
    beatmapset: Beatmapset;
    totalLength: number;
    hitLength: number;
    difficulty: string;
    circleSize: number;
    overallDifficulty: number;
    approachRate: number;
    hpDrain: number;
    mode: ModeDivision;
    circles: number;
    sliders: number;
    spinners: number;
    rating: number;
    storyboard: boolean;
    video: boolean;
    playCount: number;
    passCount: number;
    packs?: string;
    maxCombo?: number;
    aimSR?: number;
    speedSR?: number;
    totalSR: number;
}

export interface BeatmapsetInfo {
    id: number;
    artist: string;
    title: string;
    hoster: string;
    chosen: boolean;
}

export interface BeatmapInfo extends BeatmapsetInfo {
    setID: number;
    difficulty: string;
}
