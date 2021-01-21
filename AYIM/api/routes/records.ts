import Router from "@koa/router";
import { createQueryBuilder } from "typeorm";
import { BeatmapsetRecord, MapperRecord } from "../../../Interfaces/records";
import { Beatmapset } from "../../../Models/beatmapset";
import { ModeDivisionType } from "../../../Models/MCA_AYIM/modeDivision";

function mapBeatmapsetRecord (response: Record<string, any>): BeatmapsetRecord[] {
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

    const records: Record<string, BeatmapsetRecord[]> = {
        playcount: mapBeatmapsetRecord(playcount),
        favourites: mapBeatmapsetRecord(favourites),
        length: mapBeatmapsetRecord(length),
        difficulties: mapBeatmapsetRecord(difficulties),
    };

    ctx.body = records;
});

recordsRouter.get("/mappers", async (ctx) => {
    const year = parseInt(ctx.query.year || new Date().getFullYear());
    const modeString: string = ctx.query.mode || "standard";
    const modeId = ModeDivisionType[modeString];
            
    const [mostRanked, mostFavourited, mostPlayed] = await Promise.all([
        createQueryBuilder()
            .from(sub => {
                return sub
                    .from("beatmapset", "beatmapset")
                    .innerJoin("beatmapset.creator", "creator")
                    .innerJoin("beatmapset.beatmaps", "beatmap", "beatmap.mode = :mode", { mode: modeId })
                    .where("beatmapset.approvedDate BETWEEN :start AND :end", { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) })
                    .select("creator.osuUsername", "username")
                    .addSelect("creator.osuUserid", "osuId")
                    .addSelect("beatmapset.ID", "beatmapsetId")
                    .groupBy("creator.osuUsername")
                    .addGroupBy("creator.osuUserid")
                    .addGroupBy("beatmapsetId");
            }, "sub")
            .select("sub.username", "username")
            .addSelect("sub.osuId", "osuId")
            .addSelect("COUNT(sub.beatmapsetID)", "value")
            .groupBy("sub.username")
            .addGroupBy("sub.osuId")
            .orderBy("value", "DESC")
            .limit(3)
            .cache(true)
            .getRawMany(),

        createQueryBuilder()
            .from(sub => {
                return sub
                    .from("beatmapset", "beatmapset")
                    .innerJoin("beatmapset.creator", "creator")
                    .innerJoin("beatmapset.beatmaps", "beatmap", "beatmap.mode = :mode", { mode: modeId })
                    .where("beatmapset.approvedDate BETWEEN :start AND :end", { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) })
                    .select("creator.osuUsername", "username")
                    .addSelect("creator.osuUserid", "osuId")
                    .addSelect("beatmapset.ID", "beatmapsetId")
                    .addSelect("beatmapset.favourites", "favourites")
                    .groupBy("creator.osuUsername")
                    .addGroupBy("creator.osuUserid")
                    .addGroupBy("beatmapset.ID")
                    .addGroupBy("beatmapset.favourites");
            }, "sub")
            .select("sub.username", "username")
            .addSelect("sub.osuId", "osuId")
            .addSelect("SUM(sub.favourites)", "value")
            .groupBy("sub.username")
            .addGroupBy("sub.osuId")
            .orderBy("value", "DESC")
            .limit(3)
            .cache(true)
            .getRawMany(),

        createQueryBuilder()
            .from(sub => {
                return sub
                    .from("beatmapset", "beatmapset")
                    .innerJoin("beatmapset.creator", "creator")
                    .innerJoin("beatmapset.beatmaps", "beatmap", "beatmap.mode = :mode", { mode: modeId })
                    .where("beatmapset.approvedDate BETWEEN :start AND :end", { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) })
                    .select("creator.osuUsername", "username")
                    .addSelect("creator.osuUserid", "osuId")
                    .addSelect("beatmapset.ID", "beatmapsetId")
                    .addSelect("beatmap.playCount", "playCount")
                    .groupBy("creator.osuUsername")
                    .addGroupBy("creator.osuUserid")
                    .addGroupBy("beatmapset.ID")
                    .addGroupBy("beatmap.playCount");
            }, "sub")
            .select("sub.username", "username")
            .addSelect("sub.osuId", "osuId")
            .addSelect("SUM(sub.playCount)", "value")
            .groupBy("sub.username")
            .addGroupBy("sub.osuId")
            .orderBy("value", "DESC")
            .limit(3)
            .cache(true)
            .getRawMany(),
    ]);

    const records: Record<string, MapperRecord[]> = {
        mostRanked,
        mostFavourited,
        mostPlayed,
    };

    ctx.body = records;
});

export default recordsRouter;
