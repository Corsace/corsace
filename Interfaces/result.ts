import { BeatmapsetInfo } from "./beatmap";
import { CategoryType } from "./category";
import { UserChoiceInfo } from "./user";
import { ResultVote } from "./vote";

export interface BeatmapResult extends BeatmapsetInfo {
    placement: number,
    votes: number
}

export interface UserResult extends UserChoiceInfo {
    placement: number,
    votes: number
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
                votes: vote.count,
            } as BeatmapResult);
        } else if (categoryType === CategoryType.Users && vote.user) {
            userResults.push({
                username: vote.user.osuUsername,
                userID: vote.user.osuID,
                avatar: `https://a.ppy.sh/${vote.user.osuID}`,
                placement: vote.placement,
                votes: vote.count,
            } as UserResult);
        }
    }
    if (categoryType === CategoryType.Beatmapsets)
        return beatmapResults;

    return userResults;
}