import { queue } from "async";
import ormConfig from "../../ormconfig";
import { Beatmapset, BeatmapsetRankedStatus } from "../../Models/beatmapset";
import { timeFormatter } from "./fetchYearMaps";
import { osuClient } from "../osu";

let bmQueued = 0; // beatmapsets inserted in queue
let bmUpdated = 0; // beatmapsets updated in db (no longer in queue)
let lastQueuedBeatmapsetId = 0;

async function updateBeatmapset (beatmapsetId: number) {
    try {
        const [beatmap] = await osuClient.beatmaps.getBySetId(beatmapsetId) as Beatmapset[];
        if (!beatmap) {
            console.error(`Couldn't find beatmapset ${beatmapsetId}!`);
            return;
        }

        if (beatmap.rankedStatus !== BeatmapsetRankedStatus.Graveyard) {
            await Beatmapset.update({ ID: beatmapsetId }, { rankedStatus: beatmap.rankedStatus });
        }
        bmUpdated++;
    } catch (err) {
        console.error("An unexpected error occured while processing beatmapset " + beatmapsetId, err);
    }
}

async function script () {
    await ormConfig.initialize();
    const start = Date.now();

    const processingQueue = queue(async (beatmapsetId: number, cb: () => void) => {
        await updateBeatmapset(beatmapsetId);
        cb();
    }, process.env.CONCURRENCY ? Number(process.env.CONCURRENCY) : 10);

    const printStatus = () => {
        const eta = bmUpdated === 0 ? "N/A" : timeFormatter(((Date.now() - start) / bmUpdated) * (bmQueued - bmUpdated));
        console.log(new Date(), `Queued beatmapsets: ${bmQueued} / Updated beatmapsets: ${bmUpdated} / ETA: ${eta}`);
    };
    const progressInterval = setInterval(printStatus, 1000);

    console.log(`Fixing all beatmapsets rankedStatus from osu! API...`);
    printStatus();

    const dbSelectBatchSize = process.env.BATCH_SIZE ? Number(process.env.BATCH_SIZE) : 50;

    while (true) {
        const beatmapsets = await Beatmapset.createQueryBuilder("beatmapset")
            .select("beatmapset.ID")
            .where("beatmapset.rankedStatus = :rankedStatus", { rankedStatus: `${BeatmapsetRankedStatus.Graveyard}` })
            .andWhere("beatmapset.ID > :lastId", { lastId: lastQueuedBeatmapsetId })
            .orderBy("beatmapset.id")
            .take(dbSelectBatchSize)
            .getMany();
        for(const beatmapset of beatmapsets)
            void processingQueue.push(beatmapset.ID);
        bmQueued += beatmapsets.length;
        lastQueuedBeatmapsetId = beatmapsets[beatmapsets.length - 1]?.ID;
        if(beatmapsets.length < dbSelectBatchSize)
            break;
    }
    if(!processingQueue.idle())
        await processingQueue.drain();
    clearInterval(progressInterval);
    printStatus();

    console.log("All beatmapsets have been successfully updated!");
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
