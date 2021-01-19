import Router from "@koa/router";
import { BeatmapsetRecord } from "../../../Interfaces/records";
import { Beatmapset } from "../../../Models/beatmapset";
import { ModeDivisionType } from "../../../Models/MCA_AYIM/modeDivision";

function mapBeatmapsetRecord (response: Record<string, any>): BeatmapsetRecord {
    return response.map(res => ({
        beatmapset: {
            id: res.beatmapset_ID,
            artist: res.beatmapset_artist,
            title: res.beatmapset_title,
        },
        creator: {
            id: res.creator_ID,
            osuId: res.creator_osuUserid,
            username: res.creator_osuUsername,
        },
        value: res.value,
    }));
}

const recordsRouter = new Router();

recordsRouter.get("/beatmapsets", async (ctx) => {
    const year = parseInt(ctx.query.year || new Date().getFullYear());
    const modeString: string = ctx.query.mode || "standard";
    const modeId = ModeDivisionType[modeString];

    const [playcount, favourites, length, difficulties] = await Promise.all([
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("SUM(beatmap.playCount)", "value")
            .groupBy("beatmapset.ID")
            .orderBy("value", "DESC")
            .getRawMany(),

            
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("beatmapset.favourites", "value")
            .groupBy("beatmapset.ID")
            .orderBy("value", "DESC")
            .getRawMany(),
            
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("beatmap.hitLength", "value")
            .groupBy("beatmapset.ID")
            .addGroupBy("beatmap.hitLength")
            .orderBy("value", "DESC")
            .getRawMany(),

        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("COUNT(beatmap.ID)", "value")
            .groupBy("beatmapset.ID")
            .orderBy("value", "DESC")
            .getRawMany(),
    ]);

    const records = {
        playcount: mapBeatmapsetRecord(playcount),
        favourites: mapBeatmapsetRecord(favourites),
        length: mapBeatmapsetRecord(length),
        difficulties: mapBeatmapsetRecord(difficulties),
    };

    ctx.body = records;
});

export default recordsRouter;
