import { ModeDivisionType, ModeDivision } from "../../Models/MCA_AYIM/modeDivision";
import { queue } from "async";
import { createConnection } from "typeorm";
import memoizee from "memoizee";
import { Beatmap as APIBeatmap } from "nodesu";
import { config } from "node-config-ts";
import { Beatmapset } from "../../Models/beatmapset";
import axios from "axios";
import { Beatmap } from "../../Models/beatmap";
import { OAuth, User } from "../../Models/user";
import { UsernameChange } from "../../Models/usernameChange";
import { MCAEligibility } from "../../Models/MCA_AYIM/mcaEligibility";
import { RateLimiterMemory, RateLimiterQueue } from "rate-limiter-flexible";

let bmQueued = 0; // beatmaps inserted in queue
let bmInserted = 0; // beatmaps inserted in db (no longer in queue)
let bmsInserted = 0; // beatmapsets inserted in db (no longer in queue)

function sleep (ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), ms);
    });
}

function timeFormatter (ms: number): string {
    if (isNaN(ms) || ms <= 0)
        return "0:00:00";

    let secs = Math.floor(ms / 1000);
    let mins = 0;
    let hrs = 0;
    while (secs >= 60) {
        secs -= 60;
        mins++;
    }
    while (mins >= 60) {
        mins -= 60;
        hrs++;
    }
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const getModeDivison = memoizee(async (modeDivisionId: number) => {
    modeDivisionId += 1;
    let mode = await ModeDivision.findOne(modeDivisionId);
    if (!mode) {
        mode = new ModeDivision;
        mode.ID = modeDivisionId;
        mode.name = ModeDivisionType[mode.ID];
        mode = await mode.save();
    }
    return mode;
});

// API call to fetch a user's country.
async function getMissingOsuUserProperties (userID: number): Promise<{ country: string; username: string; }> {
    const userApi = (await axios.get(`https://osu.ppy.sh/api/get_user?k=${config.osu.v1.apiKey}&u=${userID}&type=id`)).data as any[];
    if (userApi.length === 0)
        return { country: "", username: "" };
    return {
        country: userApi[0].country,
        username: userApi[0].username,
    };
};

const getUser = async (targetUser: { username?: string, userID: number, country?: string }): Promise<User> => {
    let user = await User.findOne({ osu: { userID: `${targetUser.userID}` } });
    
    if (!user) {
        let country = targetUser.country;
        let username = targetUser.username;
        if (!username || !country) {
            const { country: newCountry, username: newUsername } = await getMissingOsuUserProperties(targetUser.userID);
            country = newCountry;
            username = newUsername;
        }

        user = new User;
        user.osu = new OAuth;
        user.osu.userID = `${targetUser.userID}`;
        user.osu.username = username;
        user.osu.avatar = "https://a.ppy.sh/" + targetUser.userID;
        user.country = country;
        user = await user.save();
    } else if (targetUser.username && user.osu.username !== targetUser.username) {
        // Check if old exists (add if it doesn't)
        if (!user.otherNames.some(v => v.name === user!.osu.username)) {
            const nameChange = new UsernameChange;
            nameChange.name = user.osu.username;
            nameChange.user = user;
            await nameChange.save();
            user.otherNames.push(nameChange);
        }

        // Check if new exists (remove if it does)
        if (user.otherNames.some(v => v.name === targetUser.username)) {
            await user.otherNames.find(v => v.name === targetUser.username)!.remove();
            user.otherNames = user.otherNames.filter(v => v.name !== targetUser.username);
        }
        user.osu.username = targetUser.username;
        await user.save();
    }

    return user;
};

const getRankers = async (beatmapEvents: BNEvent[]): Promise<User[]> => {
    const rankers: User[] = [];
    if (beatmapEvents.length > 0)
        for (const bnEvent of beatmapEvents.reverse()) { 
            // Run from rank to the last disqual/nom_reset event 
            // (or to the beginning of list if no disqual/nom_reset)
            if (bnEvent.type === "rank")
                continue;
            if (bnEvent.type === "disqualify" || bnEvent.type === "nomination_reset")
                break;
            
            const bnUser = await getUser({ userID: bnEvent.userId });
            rankers.push(bnUser);
        }
    return rankers;
}


// Memoized method to create or fetch a BeatmapSet from DB.
const getBeatmapSet = memoizee(async (beatmap: APIBeatmap): Promise<Beatmapset> => {
    let beatmapSet = new Beatmapset;
    beatmapSet.ID = beatmap.setId;
    beatmapSet.approvedDate = beatmap.approvedDate;
    beatmapSet.submitDate = beatmap.submitDate;
    beatmapSet.BPM = beatmap.bpm;
    beatmapSet.artist = beatmap.artist;
    beatmapSet.title = beatmap.title;
    beatmapSet.genre = genres[beatmap.genre];
    beatmapSet.language = langs[beatmap.language];
    beatmapSet.tags = beatmap.tags.join(" ");
    beatmapSet.favourites = beatmap.favoriteCount;

    const user = await getUser({ username: beatmap.creator, userID: beatmap.creatorId });
    beatmapSet.creator = user;
    
    // interOp call to pishi's BN site to get the user IDs of the BNs of a beatmapset.
    // NOTE: The BN site only has nomination data from ~mid 2019 onward.
    const beatmapEvents = await bnsRawData.get(beatmapSet.ID);
    bnsRawData.delete(beatmapSet.ID);
    beatmapSet.rankers = beatmapEvents ? await getRankers(beatmapEvents) : [];
    
    beatmapSet = await beatmapSet.save();
    bmsInserted++;
    return beatmapSet;
}, {
    max: 200,
    normalizer: ([beatmap]) => `${beatmap.setId}`,
});

const getMCAEligibility = memoizee(async function(year: number, user: User) {
    let eligibility = await MCAEligibility.findOne({ relations: ["user"], where: { year, user }});
    if (!eligibility) {
        eligibility = new MCAEligibility();
        eligibility.year = year;
        eligibility.user = user;
    }
    return eligibility;
}, {
    max: 200,
    normalizer: ([year, user]) => {
        return `${year}-${user.ID}`;
    },
});


type BeatmapsetID = number;
export type BNEvent = {
    type: "nominate" | "qualify" | "disqualify" | "nomination_reset" | "rank";
    userId: number;
}
const bnsRawData = new Map<BeatmapsetID, Promise<null | BNEvent[]>>();
const bnFetchingLimiter = new RateLimiterQueue(new RateLimiterMemory({ points: 20, duration: 1 }));
const getBNsApiCallRawData = async (beatmapSetID: BeatmapsetID): Promise<null | BNEvent[]> => {
    if (config.bn.username && config.bn.secret) {
        try {
            await bnFetchingLimiter.removeTokens(1);
            return (await axios.get<BNEvent[]>(`https://bn.mappersguild.com/interOp/events/${beatmapSetID}`, {
                headers: {
                    username: config.bn.username,
                    secret: config.bn.secret,
                },
            })).data;
        } catch (err: any) {
            console.error('An error occured while fetching BNs for beatmap set ' + beatmapSetID);
            console.error(err.stack);
            process.exit(1);
        }
    }
    return null;
}

async function insertBeatmap (apiBeatmap: APIBeatmap) {
    let beatmap = new Beatmap;
    beatmap.ID = apiBeatmap.id;
    beatmap.mode = await getModeDivison(apiBeatmap.mode as number);
    beatmap.difficulty = apiBeatmap.version;
    beatmap.circleSize = apiBeatmap.CS;
    beatmap.approachRate = apiBeatmap.AR;
    beatmap.overallDifficulty = apiBeatmap.OD;
    beatmap.hpDrain = apiBeatmap.HP;
    beatmap.circles = apiBeatmap.countNormal;
    beatmap.sliders = apiBeatmap.countSlider;
    beatmap.spinners = apiBeatmap.countSpinner;
    beatmap.rating = apiBeatmap.rating;
    beatmap.passCount = apiBeatmap.passcount;
    beatmap.hitLength = apiBeatmap.hitLength;
    beatmap.totalLength = apiBeatmap.totalLength;
    beatmap.totalSR = apiBeatmap.difficultyRating;
    beatmap.aimSR = apiBeatmap.diffAim;
    beatmap.speedSR = apiBeatmap.diffSpeed;
    beatmap.maxCombo = apiBeatmap.maxCombo;
    beatmap.playCount = apiBeatmap.playcount;
    beatmap.packs = apiBeatmap.packs?.join(",");
    beatmap.storyboard = apiBeatmap.storyboard;
    beatmap.video = apiBeatmap.video;

    beatmap.beatmapset = await getBeatmapSet(apiBeatmap);

    if (!beatmap.difficulty.includes("'")) {
        const eligibility = await getMCAEligibility(apiBeatmap.approvedDate.getUTCFullYear(), beatmap.beatmapset.creator);
        if (!eligibility[modeList[apiBeatmap.mode as number]]) {
            eligibility[modeList[apiBeatmap.mode as number]] = true;
            eligibility.storyboard = true;
            await eligibility.save();
        }
    }

    beatmap = await beatmap.save();
    bmInserted++;
    return beatmap;
}

async function script () {
    if (process.env.NODE_ENV !== "development") {
        throw new Error("To prevent disasters, you can only run this script using NODE_ENV=development; eg. `NODE_ENV=development npm run fetchMaps 2020`.");
    }

    const args = process.argv.slice(2);
    const year = parseInt(args[0]); // Year to get the maps for
    if (Number.isNaN(year)) {
        throw new Error("Please provide a valid year in first argument!");
    }
    const until = new Date(`${year + 1}-01-01`);

    if (!config.bn.username || !config.bn.secret) {
        console.warn("WARNING: No BN website username/secret provided in config. Beatmapsets rankers will not be retrieved.");
    }

    console.log("This script can damage your database. Make sure to only execute this if you know what you're doing.");
    console.log("This script will automatically continue in 5 seconds. Cancel using Ctrl+C.");
    await sleep(5000);

    const conn = await createConnection();
    // ensure schema is up-to-date
    await conn.synchronize();
    console.log("DB schema is now up-to-date!");
    const start = Date.now();

    const processingQueue = queue(async (beatmap: APIBeatmap, cb: () => void) => {
        await insertBeatmap(beatmap);
        cb();
    }, 1);

    const printStatus = () => {
        const eta = bmInserted === 0 ? "N/A" : timeFormatter(((Date.now() - start) / bmInserted) * (bmQueued - bmInserted));
        console.log(new Date(), `Queued beatmaps: ${bmQueued} / Imported beatmaps: ${bmInserted} / Imported beatmapsets: ${bmsInserted} / ETA: ${eta}`);
    };
    const progressInterval = setInterval(printStatus, 1000);

    let since = new Date((await Beatmapset.findOne({ order: { approvedDate: "DESC" } }))?.approvedDate || new Date("2006-01-01"));
    console.log(`Fetching all beatmaps starting from ${since.toJSON()} until ${year}-12-31...`);
    printStatus();
    const queuedBeatmapIds: number[] = [];
    while (since.getTime() < until.getTime()) {
        const newBeatmapsApi = (await axios.get(`https://osu.ppy.sh/api/get_beatmaps?k=${config.osu.v1.apiKey}&since=${(new Date(since.getTime() - 1000)).toJSON().slice(0,19).replace("T", " ")}`)).data as any[];
        for(const newBeatmapApi of newBeatmapsApi) {
            const newBeatmap = new APIBeatmap(newBeatmapApi);
            if(queuedBeatmapIds.includes(newBeatmap.id))
                continue;
            since = newBeatmap.approvedDate;
            if(newBeatmap.approvedDate.getTime() > until.getTime())
                break;
            if(![1, 2].includes(Number(newBeatmap.approved)))
                continue;

            if (!bnsRawData.has(newBeatmap.beatmapSetId)) {
                bnsRawData.set(newBeatmap.beatmapSetId, getBNsApiCallRawData(newBeatmap.beatmapSetId));
            }

            queuedBeatmapIds.push(newBeatmap.id);
            processingQueue.push(newBeatmap);
            bmQueued++;
        }
    }
    if(queuedBeatmapIds.length !== 0)
        await processingQueue.drain();
    clearInterval(progressInterval);
    printStatus();

    console.log("All beatmaps have been successfully processed!");
}

if(module === require.main) {
    script()
        .then(() => {
            console.log("Script completed successfully!");
            process.exit(0);
        })
        .catch((err: Error) => {
            console.error("Script encountered an error!");
            console.error(err.stack);
            process.exit(1);
        });
}

const genres = [
    "any",
    "unspecified",
    "video game",
    "anime",
    "rock",
    "pop",
    "other",
    "novelty",
    "---",
    "hip hop",
    "electronic",
    "metal",
    "classical",
    "folk",
    "jazz",
];

const langs = [
    "any",
    "unspecified",
    "english",
    "japanese",
    "chinese",
    "instrumental",
    "korean",
    "french",
    "german",
    "swedish",
    "spanish",
    "italian",
    "russian",
    "polish",
    "other",
];

const modeList = [
    "standard",
    "taiko",
    "fruits",
    "mania",
];

export { getUser, getBNsApiCallRawData, getRankers };
