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

function valueToFixed (record: any, digits = 2): any {
    record.value = parseFloat(record.value).toFixed(digits);
    return record;
}

function padLengthWithZero (lengthRecord: Record<string, any>): Record<string, any> {
    // e.g. a time like 6:5 should actually be 6:05
    const value = lengthRecord.value;
    if (value.slice(-2, -1) === ":") {
        lengthRecord.value =  value.slice(0, -1) + "0" + value.slice(-1);
    }
    return lengthRecord;
}

const recordsRouter = new Router();

recordsRouter.get("/beatmapsets", async (ctx) => {
    const year = parseInt(ctx.query.year || new Date().getFullYear());
    const modeString: string = ctx.query.mode || "standard";
    const modeId = ModeDivisionType[modeString];

    const [
        playcount,
        favourites,
        favouritesExclHybrid,
        length,
        difficulties,
        circles,
        sliders,
        avgCircles,
        avgSliders,
        highestSr,
        lowestSr] = await Promise.all([
        // Playcount
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("SUM(beatmap.playCount)", "value")
            .groupBy("beatmapset.ID")
            .orderBy("value", "DESC")
            .getRawMany(),

        // Favourites
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("beatmapset.favourites", "value")
            .groupBy("beatmapset.ID")
            .orderBy("value", "DESC")
            .getRawMany(),
        
        // Favourites (non-hybrid)
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("beatmapset.favourites", "value")
            .andWhere(`not exists (select beatmap.beatmapsetID as ref_ID, beatmap.mode as ref_Mode from beatmap where ref_ID=beatmapset.ID and ref_Mode != ${modeId} )`)
            .groupBy("beatmapset.ID")
            .orderBy("value", "DESC")
            .getRawMany(),

        // Length
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("concat(floor(beatmap.hitLength/60),':',beatmap.hitLength - floor(beatmap.hitLength/60)*60)", "value")
            .groupBy("beatmapset.ID")
            .addGroupBy("beatmap.hitLength")
            .orderBy("beatmap.hitLength", "DESC")
            .getRawMany(),

        // Difficulties
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("COUNT(beatmap.ID)", "value")
            .groupBy("beatmapset.ID")
            .orderBy("value", "DESC")
            .getRawMany(),

        // Total Circles Per Set
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("SUM(beatmap.circles)", "value")
            .groupBy("beatmapset.ID")
            .orderBy("value", "DESC")
            .getRawMany(),

        // Total Sliders Per Set
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("SUM(beatmap.sliders)", "value")
            .groupBy("beatmapset.ID")
            .orderBy("value", "DESC")
            .getRawMany(),

        // Average Circles Per Set
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("AVG(beatmap.circles)", "value")
            .groupBy("beatmapset.ID")
            .orderBy("value", "DESC")
            .getRawMany(),

        // Average Sliders per Set
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("AVG(beatmap.sliders)", "value")
            .groupBy("beatmapset.ID")
            .orderBy("value", "DESC")
            .getRawMany(),

        // Highest SR
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("beatmap.totalSR", "value")
            .groupBy("beatmapset.ID")
            .addGroupBy("beatmap.totalSR")
            .orderBy("value", "DESC")
            .getRawMany(),

        // Lowest SR
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("beatmap.totalSR", "value")
            .groupBy("beatmapset.ID")
            .addGroupBy("beatmap.totalSR")
            .orderBy("value", "ASC")
            .getRawMany(),
    ]);

    const records: Record<string, BeatmapsetRecord[]> = {
        playcount: mapBeatmapsetRecord(playcount),
        favourites: mapBeatmapsetRecord(favourites),
        favouritesExclHybrid: mapBeatmapsetRecord(favouritesExclHybrid),
        length: mapBeatmapsetRecord(length.map(l => padLengthWithZero(l))),
        difficulties: mapBeatmapsetRecord(difficulties),
        circles: mapBeatmapsetRecord(circles),
        sliders: mapBeatmapsetRecord(sliders),
        avgCirclesPerSet: mapBeatmapsetRecord(avgCircles).map(o => valueToFixed(o, 0)),
        avgSlidersPerSet: mapBeatmapsetRecord(avgSliders).map(o => valueToFixed(o, 0)),
        highestSr: mapBeatmapsetRecord(highestSr).map(o => valueToFixed(o)),
        lowestSr: mapBeatmapsetRecord(lowestSr).map(o => valueToFixed(o)),
    };

    ctx.body = records;
});

recordsRouter.get("/mappers", async (ctx) => {
    const year = parseInt(ctx.query.year || new Date().getFullYear());
    const modeString: string = ctx.query.mode || "standard";
    const modeId = ModeDivisionType[modeString];

    const [mostRanked,
        mostFavs,
        leastFavs,
        mostPlayed,
        leastPlayed,
        highestAvgSr,
        lowestAvgSr] = await Promise.all([
        // Most Ranked
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

        // Most Favourited
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

        // Least Favourited
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
            .orderBy("value", "ASC")
            .limit(3)
            .cache(true)
            .getRawMany(),

        // Most Played
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

        // Least Played
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
            .orderBy("value", "ASC")
            .limit(3)
            .cache(true)
            .getRawMany(),

        // Highest Avg SR
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
                    .addSelect("beatmap.totalSR", "totalSR")
                    .groupBy("creator.osuUsername")
                    .addGroupBy("creator.osuUserid")
                    .addGroupBy("beatmapset.ID")
                    .addGroupBy("beatmap.totalSR");
            }, "sub")
            .select("sub.username", "username")
            .addSelect("sub.osuId", "osuId")
            .addSelect("AVG(sub.totalSR)", "value")
            .groupBy("sub.username")
            .addGroupBy("sub.osuId")
            .orderBy("value", "DESC")
            .limit(3)
            .cache(true)
            .getRawMany(),

        // Lowest Avg SR
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
                    .addSelect("beatmap.totalSR", "totalSR")
                    .groupBy("creator.osuUsername")
                    .addGroupBy("creator.osuUserid")
                    .addGroupBy("beatmapset.ID")
                    .addGroupBy("beatmap.totalSR");
            }, "sub")
            .select("sub.username", "username")
            .addSelect("sub.osuId", "osuId")
            .addSelect("AVG(sub.totalSR)", "value")
            .groupBy("sub.username")
            .addGroupBy("sub.osuId")
            .orderBy("value", "ASC")
            .limit(3)
            .cache(true)
            .getRawMany(),
    ]);

    const records: Record<string, MapperRecord[]> = {
        mostRanked,
        mostFavs,
        mostPlayed,
        highestAvgSr: highestAvgSr.map(o => valueToFixed(o)),
        leastFavs,
        leastPlayed,
        lowestAvgSr: lowestAvgSr.map(o => valueToFixed(o)),
    };

    ctx.body = records;
});

export default recordsRouter;
