import { BeatmapsetInfo } from "./beatmap";
import { UserChoiceInfo } from "./user";

export interface BeatmapResult extends BeatmapsetInfo {
    placement: number,
    votes: number
}

export interface UserResult extends UserChoiceInfo {
    placement: number,
    votes: number
}