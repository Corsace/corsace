import { Beatmapset } from "./beatmap";
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
    firstPlaceCount: number;
    totalCount: number;
    placement: number;
}

export interface UserVote {
    voter: {
        osuID: string;
        osuUsername: string;
        discordUsername: string;
    },
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
        const i = userVotes.findIndex(userVote => userVote.voter.osuID === staffVote.voter.osuID);
        if (i === -1) {
            userVotes.push({
                voter: staffVote.voter,
                votes: [resultVote],
            });
        } else
            userVotes[i].votes.push(resultVote);
    };

    userVotes = userVotes.map(userVote => {
        userVote.votes = userVote.votes.sort((a, b) => a.choice - b.choice);
        return userVote;
    });

    return userVotes;
}

export function voteCounter (votes: UserVote[]): ResultVote[] {
    if (votes.length === 0) return [];

    let candidates: ResultVote[] = [];
    let results: ResultVote[] = [];
    // Obtain candidate list
    for (const voter of votes) {
        for (const vote of voter.votes) {
            if (!candidates.some(candidate => vote.beatmapset?.ID ? vote.beatmapset?.ID === candidate.beatmapset?.ID : vote.user?.osuID === candidate.user?.osuID)) {
                candidates.push({
                    count: 0,
                    firstPlaceCount: 0,
                    totalCount: 0,
                    inRace: true,
                    beatmapset: vote.beatmapset ?? undefined,
                    user: vote.user ?? undefined,
                } as ResultVote);
            }
        }
    }
    candidates = candidates.filter((val, i, self) => self.findIndex(v => v.beatmapset?.ID ? v.beatmapset?.ID === val.beatmapset?.ID : v.user?.osuID === val.user?.osuID) === i);
    
    // Get the first choice and total appearance counts in
    for (const voter of votes) {
        for (const vote of voter.votes) {
            const k = candidates.findIndex(candidate => vote.beatmapset?.ID ? vote.beatmapset?.ID === candidate.beatmapset?.ID : vote.user?.osuID === candidate.user?.osuID);
            if (vote.choice === 1)
                candidates[k].firstPlaceCount++
            candidates[k].totalCount++; 
        }
    }

    // Run for each placement
    for (;;) {
        // Check if last used vote is still in race, add the next best unused vote otherwise
        for (;;) {
            for (let i = 0; i < votes.length; i++) {
                const voter = votes[i];
                for (let j = 0; j < voter.votes.length; j++) {
                    const vote = voter.votes[j];
                    if (!vote.inRace) continue;

                    const k = candidates.findIndex(candidate => vote.beatmapset?.ID ? vote.beatmapset?.ID === candidate.beatmapset?.ID : vote.user?.osuID === candidate.user?.osuID);
                    if (k === -1) { // Placement for this choice is already accounted for in results array
                        votes[i].votes[j].used = true;
                        votes[i].votes[j].inRace = false;
                        continue;
                    };
                    
                    if (!candidates[k].inRace) { // Choice dropped out of the race last round
                        votes[i].votes[j].inRace = false;
                        continue;
                    }

                    if (vote.used) // Choice is still in race and this vote is used so there's nothing to do
                        break;

                    candidates[k].count++;
                    votes[i].votes[j].used = true;
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
            let sum = 0;
            let min = inRace[inRace.length - 1].count;
            inRace.forEach(candidate => sum += candidate.count);
            if (candidates[0].count > sum / 2.0 || candidates[0].count === min)
                break;

            for (let i = candidates.length - 1; i > 0; i--) {
                if (candidates[i].count > min) break;

                candidates[i].inRace = false;
            }
        }

        // Remove top ones this run
        let max = candidates[0].count;
        const placement = results.length + 1;
        for (let i = 0; i < candidates.length; i++) {
            if (candidates[i].count !== max) {
                candidates[i].inRace = true;
                candidates[i].count = 0;
            } else
                results.push({
                    ...candidates[i],
                    placement,
                });
        }
        candidates = candidates.filter(candidate => candidate.count !== max);

        // Continue until 0 candidates are left
        if (candidates.length === 0)
            break;

        // Reset candidate counts + vote uses
        for (let i = 0; i < votes.length; i++) {
            for (let j = 0; j < votes[i].votes.length; j++) {
                votes[i].votes[j].used = false;
                votes[i].votes[j].inRace = true;
            }
        }
    }

    return results;
}