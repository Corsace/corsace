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
    let mode = await ModeDivision.findOne(modeDivisionId + 1);
    if (!mode) {
        mode = new ModeDivision;
        mode.ID = modeDivisionId;
        mode.name = ModeDivisionType[mode.ID];
        mode = await mode.save();
    }
    return mode;
});

// Memoized method to create or fetch a BeatmapSet from DB.
const existingSets: number[] = [];
const getBeatmapSet = memoizee(async (beatmap: APIBeatmap): Promise<Beatmapset> => {
    if(existingSets.includes(beatmap.setId))
        return await Beatmapset.findOne(beatmap.setId) as Beatmapset;
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

    let user = await User.findOne({ osu: { userID: `${beatmap.creatorId}` } });
    
    if (!user) {
        user = new User;
        user.osu = new OAuth;
        user.osu.userID = `${beatmap.creatorId}`;
        user.osu.username = beatmap.creator;
        user.osu.avatar = "https://a.ppy.sh/" + beatmap.creatorId;
        user = await user.save();
    } else if (user.osu.username !== beatmap.creator) {
        // Check if old exists (add if it doesn't)
        if (!user.otherNames.some(v => v.name === user!.osu.username)) {
            const nameChange = new UsernameChange;
            nameChange.name = user.osu.username;
            nameChange.user = user;
            await nameChange.save();
            user.otherNames.push(nameChange);
        }

        // Check if new exists (remove if it does)
        if (user.otherNames.some(v => v.name === beatmap.creator)) {
            await user.otherNames.find(v => v.name === beatmap.creator)!.remove();
            user.otherNames = user.otherNames.filter(v => v.name !== beatmap.creator);
        }
        user.osu.username = beatmap.creator;
        await user.save();
    }
    beatmapSet.creator = user;

    beatmapSet = await beatmapSet.save();
    bmsInserted++;
    existingSets.push(beatmap.setId);
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
        const eta = ((Date.now() - start) / bmInserted) * (bmQueued - bmInserted);
        console.log(new Date(), `Queued beatmaps: ${bmQueued} / Imported beatmaps: ${bmInserted} / Imported beatmapsets: ${bmsInserted} / ETA: ${timeFormatter(eta)}`);
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
