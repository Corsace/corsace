import { queue } from "async";
import memoizee from "memoizee";
import { Beatmap as APIBeatmap } from "nodesu";
import { config } from "node-config-ts";
import axios from "axios";
import { LessThan } from "typeorm";
import { Beatmap } from "../../Models/beatmap";
import { Beatmapset } from "../../Models/beatmapset";
import { OsuOAuth, User } from "../../Models/user";
import { UsernameChange } from "../../Models/usernameChange";
import { MCAEligibility } from "../../Models/MCA_AYIM/mcaEligibility";
import { ModeDivision } from "../../Models/MCA_AYIM/modeDivision";
import { RateLimiterMemory, RateLimiterQueue } from "rate-limiter-flexible";
import { isPossessive } from "../../Models/MCA_AYIM/guestRequest";
import { sleep } from "../utils/sleep";
import { ModeDivisionType, modeList } from "../../Interfaces/modes";
import { genres, langs } from "../../Interfaces/beatmap";
import ormConfig from "../../ormconfig";

let bmQueued = 0; // beatmaps inserted in queue
let bmInserted = 0; // beatmaps inserted in db (no longer in queue)
let bmsInserted = 0; // beatmapsets inserted in db (no longer in queue)

export function timeFormatter (ms: number): string {
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
    let mode = await ModeDivision.findOne({ where: { ID: modeDivisionId }});
    if (!mode) {
        mode = new ModeDivision();
        mode.ID = modeDivisionId;
        mode.name = ModeDivisionType[mode.ID];
        mode = await mode.save();
    }
    return mode;
});

// API call to fetch a user's country.
async function getMissingOsuUserProperties (userID: number): Promise<{ country: string | null; username: string | null; }> {
    const { data: userApi } = await axios.get<any[]>(`${config.osu.proxyBaseUrl ?? "https://osu.ppy.sh"}/api/get_user?k=${config.osu.v1.apiKey}&u=${userID}&type=id`);
    if (userApi.length === 0)
        return { country: null, username: null };
    return {
        country: userApi[0].country,
        username: userApi[0].username,
    };
}

const getUser = async (targetUser: { username?: string, userID: number, country?: string }): Promise<User> => {
    let user = await User.findOne({ where: { osu: { userID: `${targetUser.userID}` }}});

    if (!user) {
        let country = targetUser.country;
        let username = targetUser.username;
        if (!username || !country) {
            const { country: newCountry, username: newUsername } = await getMissingOsuUserProperties(targetUser.userID);
            country = newCountry ?? country ?? "";
            username = newUsername ?? username ?? "";
        }

        user = new User();
        user.osu = new OsuOAuth();
        user.osu.userID = `${targetUser.userID}`;
        user.osu.username = username;
        user.osu.avatar = "https://a.ppy.sh/" + targetUser.userID;
        user.country = country;
        user = await user.save();
    } else if (targetUser.username && user.osu.username !== targetUser.username) {
        // osu! name change detection routine:
        // The username that we have in DB doesn't match the one that we got from a beatmapset.

        const { username: currentUsername } = await getMissingOsuUserProperties(targetUser.userID);

        // currentUsername can be empty if user is restricted; ignoring API result in this case.
        if (currentUsername && user.osu.username !== currentUsername) {
            // The username from DB doesn't match their current name; adding to history and updating.
            if (!user.otherNames.some(v => v.name === user!.osu.username)) {
                const nameChange = new UsernameChange();
                nameChange.name = user.osu.username;
                nameChange.user = user;
                await nameChange.save();
                user.otherNames.push(nameChange);
            }
            user.osu.username = currentUsername;
        }

        if (targetUser.username !== user.osu.username) {
            // The name that we got from a beatmapset isn't their current name according to current API or DB if restricted; adding to history.
            if (!user.otherNames.some(v => v.name === targetUser.username)) {
                const nameChange = new UsernameChange();
                nameChange.name = targetUser.username;
                nameChange.user = user;
                await nameChange.save();
                user.otherNames.push(nameChange);
            }
        }

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

            if (!rankers.some((ranker) => ranker.osu.userID === `${bnEvent.userId}`)) {
                const bnUser = await getUser({ userID: bnEvent.userId });
                rankers.push(bnUser);
            }
        }
    return rankers;
};

// Memoized method to create or fetch a BeatmapSet from DB.
const getBeatmapSet = memoizee(async (beatmap: APIBeatmap): Promise<Beatmapset> => {
    let beatmapSet = await Beatmapset.findOne({
        where: {
            ID: beatmap.beatmapSetId,
        },
    });
    if (!beatmapSet)
        beatmapSet = new Beatmapset();

    beatmapSet.ID = beatmap.setId;
    beatmapSet.approvedDate = beatmap.approvedDate;
    beatmapSet.rankedStatus = beatmap.approved;
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
    let eligibility = await MCAEligibility.findOne({ relations: ["user"], where: { year, user: { ID: user.ID }}});
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
export interface BNEvent {
    type: "nominate" | "qualify" | "disqualify" | "nomination_reset" | "rank";
    userId: number;
}
const bnsRawData = new Map<BeatmapsetID, Promise<null | BNEvent[]>>();
const bnFetchingLimiter = new RateLimiterQueue(new RateLimiterMemory({ points: 20, duration: 1 }));
const getBNsApiCallRawData = async (beatmapSetID: BeatmapsetID): Promise<null | BNEvent[]> => {
    if (config.bn.username && config.bn.secret) {
        try {
            await bnFetchingLimiter.removeTokens(1);
            const { data } = await axios.get<BNEvent[]>(`https://bn.mappersguild.com/interOp/events/${beatmapSetID}`, {
                headers: {
                    username: config.bn.username,
                    secret: config.bn.secret,
                },
            });
            return data;
        } catch (err: any) {
            console.error("An error occured while fetching BNs for beatmap set " + beatmapSetID);
            console.error(err.stack);
            process.exit(1);
        }
    }
    return null;
};

async function insertBeatmap (apiBeatmap: APIBeatmap) {
    let beatmap = await Beatmap.findOne({
        where: {
            ID: apiBeatmap.id,
        },
    });
    if (!beatmap)
        beatmap = new Beatmap();

    beatmap.ID = apiBeatmap.id;
    beatmap.mode = await getModeDivison(apiBeatmap.mode!);
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

    if (!isPossessive(beatmap.difficulty) && !isNaN(apiBeatmap.approvedDate.getUTCFullYear())) {
        const eligibility = await getMCAEligibility(apiBeatmap.approvedDate.getUTCFullYear(), beatmap.beatmapset.creator);
        const mode = modeList[apiBeatmap.mode!];
        if (mode in ModeDivisionType) {
            eligibility[mode as keyof typeof ModeDivisionType] = true;
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

    await ormConfig.initialize();
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

    let since = new Date((await Beatmapset.findOne({ where: { approvedDate: LessThan(new Date(`${year}-01-01`)) }, order: { approvedDate: "DESC" } }))?.approvedDate ?? new Date("2006-01-01"));
    console.log(`Fetching all beatmaps starting from ${since.toJSON()} until ${year}-12-31...`);
    printStatus();
    const queuedBeatmapIds: number[] = [];
    while (since.getTime() < until.getTime()) {
        const { data: newBeatmapsApi } = await axios.get<any[]>(`${config.osu.proxyBaseUrl ?? "https://osu.ppy.sh"}/api/get_beatmaps?k=${config.osu.v1.apiKey}&since=${(new Date(since.getTime() - 1000)).toJSON().slice(0,19).replace("T", " ")}`);
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
            processingQueue.push(newBeatmap).catch((err) => {
                console.error("An error occured while processing beatmap " + newBeatmap.id, err);
            });
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

export { getUser, insertBeatmap, getBNsApiCallRawData, getRankers };
