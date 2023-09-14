import { Beatmap, Beatmapset } from "./beatmap";
import { Category } from "./category";
import { User } from "./user";

export interface Vote {
    ID: number;
    voter: User;
    category: Category;
    userID?: number;
    user?: User;
    beatmapsetID?: number;
    beatmapset?: Beatmapset;
    beatmapID?: number;
    beatmap?: Beatmap;
    choice: number;
}

export interface StaffVote {
    ID: number;
    category: number;
    choice: number;
    voter: {
        ID: number;
        osuID: string;
        osuUsername: string;
        discordUsername: string;
    }
    user?: {
        osuID: string;
        osuUsername: string;
        discordUsername: string;
    }
    beatmap?: {
        ID: number;
        difficulty: string;
    }
    beatmapset?: {
        ID: number;
        artist: string;
        title: string;
        tags: string;
        creator: {
            osuID: string;
            osuUsername: string;
            discordUsername: string;
        }
    }
}

export interface ResultVote extends StaffVote {
    used: boolean;
    inRace: boolean;
    count: number;
    placeCounts: Record<number, number>;
    placement: number;
}

export interface UserVote extends Partial<StaffVote> {
    votes: ResultVote[]
}


export function groupVotesByVoters (staffVotes: StaffVote[]): UserVote[] {
    if (staffVotes.length === 0) return [];

    let userVotes: UserVote[] = [];
    for (const staffVote of staffVotes) {
        const resultVote = {
            ...staffVote,
            inRace: true,
            used: false,
        } as ResultVote;
        const i = userVotes.findIndex(userVote => userVote.voter?.osuID === staffVote.voter.osuID);
        if (i === -1) {
            userVotes.push({
                voter: staffVote.voter,
                votes: [resultVote],
            });
        } else
            userVotes[i].votes.push(resultVote);
    }

    userVotes = userVotes.map(userVote => {
        userVote.votes = userVote.votes.sort((a, b) => a.choice - b.choice);
        return userVote;
    });

    return userVotes;
}

export function voteCounter (votes: UserVote[], year: number): ResultVote[] {
    if (votes.length === 0) return [];

    let candidates: ResultVote[] = [];
    const results: ResultVote[] = [];
    // Obtain candidate list
    for (const voter of votes) {
        for (const vote of voter.votes) {
            if (!candidates.some(candidate => vote.beatmap?.ID ? vote.beatmap.ID === candidate.beatmap?.ID : vote.beatmapset?.ID ? vote.beatmapset?.ID === candidate.beatmapset?.ID : vote.user?.osuID === candidate.user?.osuID)) {
                candidates.push({
                    count: 0,
                    placeCounts: {},
                    inRace: true,
                    beatmapset: vote.beatmapset ?? undefined,
                    beatmap: vote.beatmap ?? undefined,
                    user: vote.user ?? undefined,
                } as ResultVote);
            }
        }
    }
    candidates = candidates.filter((val, i, self) => self.findIndex(v => v.beatmap?.ID ? v.beatmap?.ID === val.beatmap?.ID : v.beatmapset?.ID ? v.beatmapset?.ID === val.beatmapset?.ID : v.user?.osuID === val.user?.osuID) === i);
    
    // Get the place choice counts in
    for (const voter of votes) {
        for (const vote of voter.votes) {
            const k = candidates.findIndex(candidate => vote.beatmap?.ID ? vote.beatmap.ID === candidate.beatmap?.ID : vote.beatmapset?.ID ? vote.beatmapset?.ID === candidate.beatmapset?.ID : vote.user?.osuID === candidate.user?.osuID);
            if (candidates[k].placeCounts[vote.choice])
                candidates[k].placeCounts[vote.choice]++;
            else
                candidates[k].placeCounts[vote.choice] = 1;
        }
    }

    // Run for each placement
    for (;;) {
        // Check if last used vote is still in race, add the next best unused vote otherwise
        for (;;) {
            for (const userVote of votes) {
                for (const resultVote of userVote.votes) {
                    if (!resultVote.inRace) continue;

                    const k = candidates.findIndex(candidate => resultVote.beatmap?.ID ? resultVote.beatmap.ID === candidate.beatmap?.ID : resultVote.beatmapset?.ID ? resultVote.beatmapset?.ID === candidate.beatmapset?.ID : resultVote.user?.osuID === candidate.user?.osuID);
                    if (k === -1) { // Placement for this choice is already accounted for in results array
                        resultVote.used = true;
                        resultVote.inRace = false;
                        continue;
                    }
                    
                    if (!candidates[k].inRace) { // Choice dropped out of the race last round
                        resultVote.inRace = false;
                        continue;
                    }

                    if (resultVote.used) // Choice is still in race and this vote is used so there's nothing to do
                        break;

                    candidates[k].count++;
                    resultVote.used = true;
                    break;
                }
            }

            // Sort candidates by vote count descending, remove choices with 0 votes from race before removing actually voted things in race
            candidates = candidates.sort((a, b) => b.count - a.count);
            if (candidates[candidates.length - 1].inRace && candidates[candidates.length - 1].count === 0) {
                for (let i = candidates.length - 1; i > 0; i--) {
                    if (candidates[i].count > 0) break;
        
                    candidates[i].inRace = false;
                }
            }

            // Check if this run is over, drop bottom votes from race otherwise
            const inRace = candidates.filter(candidate => candidate.inRace);
            const next = candidates.filter(candidate => candidate.count !== candidates[0].count);
            const min = inRace[inRace.length - 1].count;
            if (year === 2019) { // Version before voting counting was changed for 2020+
                let sum = 0;
                inRace.forEach(candidate => sum += candidate.count);
                if (candidates[0].count > sum / 2.0 || candidates[0].count === min)
                    break;
            } else if ((next.length > 0 && candidates[0].count / 2.0 > next[0].count) || candidates[0].count === min)
                break;

            for (let i = candidates.length - 1; i > 0; i--) {
                if (candidates[i].count > min) break;

                candidates[i].inRace = false;
            }
        }

        // Remove top ones this run
        const max = candidates[0].count;
        const placement = results.length + 1;
        for (const candidate of candidates) {
            if (candidate.count !== max) {
                candidate.inRace = true;
                candidate.count = 0;
            } else
                results.push({
                    ...candidate,
                    placement,
                });
        }
        candidates = candidates.filter(candidate => candidate.count !== max);

        // Continue until 0 candidates are left
        if (candidates.length === 0)
            break;

        // Reset candidate counts + vote uses
        for (const userVote of votes) {
            for (const resultVote of userVote.votes) {
                resultVote.used = false;
                resultVote.inRace = true;
            }
        }
    }

    return results;
}