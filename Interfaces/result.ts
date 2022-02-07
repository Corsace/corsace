import { BeatmapInfo, BeatmapsetInfo } from "./beatmap";
import { CategoryType } from "./category";
import { UserChoiceInfo } from "./user";
import { ResultVote } from "./vote";
import { SectionCategory } from "../MCA-AYIM/store/stage";

export interface BeatmapsetResult extends BeatmapsetInfo {
    placement: number,
    firstChoice: number,
    secondThirdChoice: number,
    restChoice: number,
    votes: number,
}

export type BeatmapResult = BeatmapInfo & BeatmapsetResult;

export interface UserResult extends UserChoiceInfo {
    placement: number,
    firstChoice: number,
    secondThirdChoice: number,
    restChoice: number,
    votes: number,
}

export interface ResultColumn {
    label?: string,
    name?: string,
    size: number,
    msize?: number,
    category?: SectionCategory,
    mobileOnly?: boolean,
    desktopOnly?: boolean,
    centred?: boolean,
    prio?: boolean
}

export function votesToResults (votes: ResultVote[], categoryType: CategoryType): BeatmapsetResult[] | BeatmapResult[] |  UserResult[] {
    if (votes.length === 0) return [];

    const beatmapsetResults: BeatmapsetResult[] = [];
    const beatmapResults: BeatmapResult[] = [];
    const userResults: UserResult[] = [];
    for (const vote of votes) {
        let res = 0; 
        Object.keys(vote.placeCounts).filter(k => parseInt(k) > 3).forEach(k => res += vote.placeCounts[k]);
        if (categoryType === CategoryType.Beatmapsets && vote.beatmap) {
            beatmapResults.push({
                id: vote.beatmapset!.ID,
                artist: vote.beatmapset!.artist,
                title: vote.beatmapset!.title,
                hoster: vote.beatmapset!.creator.osuUsername,
                difficulty: vote.beatmap.difficulty,
                placement: vote.placement,
                firstChoice: vote.placeCounts[1] || 0,
                secondThirdChoice: (vote.placeCounts[2] || 0) + (vote.placeCounts[3] || 0),
                restChoice: res,
                votes: vote.count,
            } as BeatmapResult);
        } else if (categoryType === CategoryType.Beatmapsets && vote.beatmapset) {
            beatmapsetResults.push({
                id: vote.beatmapset.ID,
                artist: vote.beatmapset.artist,
                title: vote.beatmapset.title,
                hoster: vote.beatmapset.creator.osuUsername,
                placement: vote.placement,
                firstChoice: vote.placeCounts[1] || 0,
                secondThirdChoice: (vote.placeCounts[2] || 0) + (vote.placeCounts[3] || 0),
                restChoice: res,
                votes: vote.count,
            } as BeatmapsetResult);
        } else if (categoryType === CategoryType.Users && vote.user) {
            userResults.push({
                username: vote.user.osuUsername,
                userID: vote.user.osuID,
                avatar: `https://a.ppy.sh/${vote.user.osuID}`,
                placement: vote.placement,
                firstChoice: vote.placeCounts[1] || 0,
                secondThirdChoice: (vote.placeCounts[2] || 0) + (vote.placeCounts[3] || 0),
                restChoice: res,
                votes: vote.count,
            } as UserResult);
        }
    }
    if (categoryType === CategoryType.Beatmapsets && beatmapsetResults.length > 0)
        return beatmapsetResults;
    else if (categoryType === CategoryType.Beatmapsets && beatmapResults.length > 0)
        return beatmapResults;

    return userResults;
}