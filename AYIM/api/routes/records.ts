import Router from "@koa/router";
import { createQueryBuilder } from "typeorm";
import { BeatmapsetRecord, MapperRecord } from "../../../Interfaces/records";
import { Beatmap } from "../../../Models/beatmap";
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
    if (await ctx.cashed())
        return;

    const year = parseInt(ctx.query.year || new Date().getUTCFullYear());
    const modeString: string = ctx.query.mode || "standard";
    const modeId = ModeDivisionType[modeString];

    const [
        playcount,
        favourites,
        favouritesExclHybrid,
        length,
        difficulties,
        playTime,
        circles,
        sliders,
        spinners,
        avgCircles,
        avgSliders,
        avgSpinners,
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
            .andWhere((qb) => {
                const subQuery = qb.subQuery()
                    .from(Beatmap, "refMap")
                    .where("beatmapsetID = beatmapset.ID")
                    .andWhere("refMap.mode != :mode", { mode: modeId })
                    .getQuery();

                return "NOT EXISTS " + subQuery;
            })
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
        
        // Play Time
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("SUM(beatmap.hitLength)", "length")
            .addSelect("concat(floor(SUM(beatmap.hitLength)/60),':',SUM(beatmap.hitLength) - floor(SUM(beatmap.hitLength)/60)*60)", "value")
            .groupBy("beatmapset.ID")
            .orderBy("length", "DESC")
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

        // Total Spinners Per Set
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("SUM(beatmap.spinners)", "value")
            .groupBy("beatmapset.ID")
            .orderBy("value", "DESC")
            .getRawMany(),

        // Average Circles Per Diff
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("AVG(beatmap.circles)", "value")
            .groupBy("beatmapset.ID")
            .orderBy("value", "DESC")
            .getRawMany(),

        // Average Sliders per Diff
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("AVG(beatmap.sliders)", "value")
            .groupBy("beatmapset.ID")
            .orderBy("value", "DESC")
            .getRawMany(),

        // Average Spinners per Diff
        Beatmapset
            .queryRecord(year, modeId)
            .addSelect("AVG(beatmap.spinners)", "value")
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
        playTime: mapBeatmapsetRecord(playTime.map(p => padLengthWithZero(p))),
        circles: mapBeatmapsetRecord(circles),
        sliders: mapBeatmapsetRecord(sliders),
        spinners: mapBeatmapsetRecord(spinners),
        avgCirclesPerDiff: mapBeatmapsetRecord(avgCircles).map(o => valueToFixed(o, 0)),
        avgSlidersPerDiff: mapBeatmapsetRecord(avgSliders).map(o => valueToFixed(o, 0)),
        avgSpinnersPerDiff: mapBeatmapsetRecord(avgSpinners).map(o => valueToFixed(o, 0)),
        highestSr: mapBeatmapsetRecord(highestSr).map(o => valueToFixed(o)),
        lowestSr: mapBeatmapsetRecord(lowestSr).map(o => valueToFixed(o)),
    };

    ctx.body = records;
});

recordsRouter.get("/mappers", async (ctx) => {
    if (await ctx.cashed())
        return;

    const year = parseInt(ctx.query.year || new Date().getUTCFullYear());
    const modeString: string = ctx.query.mode || "standard";
    const modeId = ModeDivisionType[modeString];

    const [
        mostRanked,
        mostDiffs,
        mostFavs,
        mostFavsExclHybrid,
        mostPlayed,
        highestAvgSr,
        lowestAvgSr,
    ] = await Promise.all([
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
            .getRawMany(),
        
        // Most Total Difficulties Ranked
        createQueryBuilder()
            .from(sub => {
                return sub
                    .from("beatmapset", "beatmapset")
                    .innerJoin("beatmapset.creator", "creator")
                    .innerJoin("beatmapset.beatmaps", "beatmap", "beatmap.mode = :mode", { mode: modeId })
                    .where("beatmapset.approvedDate BETWEEN :start AND :end", { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) })
                    .select("creator.osuUsername", "username")
                    .addSelect("creator.osuUserid", "osuId")
                    .addSelect("beatmap.ID", "beatmapId")
                    .groupBy("creator.osuUsername")
                    .addGroupBy("creator.osuUserid")
                    .addGroupBy("beatmapId");
            }, "sub")
            .select("sub.username", "username")
            .addSelect("sub.osuId", "osuId")
            .addSelect("COUNT(sub.beatmapId)", "value")
            .groupBy("sub.username")
            .addGroupBy("sub.osuId")
            .orderBy("value", "DESC")
            .limit(3)
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
            .getRawMany(),

        // Most Favourited (excl. Hybrids)
        createQueryBuilder()
            .from(sub => {
                return sub
                    .from("beatmapset", "beatmapset")
                    .innerJoin("beatmapset.creator", "creator")
                    .innerJoin("beatmapset.beatmaps", "beatmap", "beatmap.mode = :mode", { mode: modeId })
                    .where("beatmapset.approvedDate BETWEEN :start AND :end", { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) })
                    .andWhere((qb) => {
                        const subQuery = qb.subQuery()
                            .from(Beatmap, "refMap")
                            .where("refMap.beatmapsetID = beatmapset.ID")
                            .andWhere("refMap.mode != :mode", { mode: modeId })
                            .getQuery();
        
                        return "NOT EXISTS " + subQuery;
                    })
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
            .getRawMany(),
    ]);

    const records: Record<string, MapperRecord[]> = {
        mostRanked,
        mostDiffs,
        mostPlayed,
        mostFavs,
        mostFavsExclHybrid,
        highestAvgSr: highestAvgSr.map(o => valueToFixed(o)),
        lowestAvgSr: lowestAvgSr.map(o => valueToFixed(o)),
    };

    ctx.body = records;
});

export default recordsRouter;
