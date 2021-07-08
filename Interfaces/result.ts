import { BeatmapsetInfo } from "./beatmap";
import { CategoryType } from "./category";
import { UserChoiceInfo } from "./user";
import { ResultVote } from "./vote";
import { SectionCategory } from "../MCA-AYIM/store/stage";

export interface BeatmapResult extends BeatmapsetInfo {
    placement: number,
    firstChoice: number,
    votes: number,
    totalVotes: number,
}

export interface UserResult extends UserChoiceInfo {
    placement: number,
    firstChoice: number,
    votes: number,
    totalVotes: number,
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

export function votesToResults(votes: ResultVote[], categoryType: CategoryType): BeatmapResult[] | UserResult[] {
    if (votes.length === 0) return [];

    const beatmapResults: BeatmapResult[] = [];
    const userResults: UserResult[] = [];
    for (const vote of votes) {
        if (categoryType === CategoryType.Beatmapsets && vote.beatmapset) {
            beatmapResults.push({
                id: vote.beatmapset.ID,
                artist: vote.beatmapset.artist,
                title: vote.beatmapset.title,
                hoster: vote.beatmapset.creator.osuUsername,
                placement: vote.placement,
                firstChoice: vote.firstPlaceCount,
                votes: vote.count,
                totalVotes: vote.totalCount,
            } as BeatmapResult);
        } else if (categoryType === CategoryType.Users && vote.user) {
            userResults.push({
                username: vote.user.osuUsername,
                userID: vote.user.osuID,
                avatar: `https://a.ppy.sh/${vote.user.osuID}`,
                placement: vote.placement,
                firstChoice: vote.firstPlaceCount,
                votes: vote.count,
                totalVotes: vote.totalCount,
            } as UserResult);
        }
    }
    if (categoryType === CategoryType.Beatmapsets)
        return beatmapResults;

    return userResults;
}