import Router from "@koa/router";
import { createQueryBuilder, SelectQueryBuilder } from "typeorm";
import { Statistic } from "../../../Interfaces/records";
import { Beatmapset } from "../../../Models/beatmapset";
import { ModeDivisionType } from "../../../Models/MCA_AYIM/modeDivision";
import { User } from "../../../Models/user";
import getHistoryStat from "../bnNatHistory";

const statisticsRouter = new Router();
const yearIDthresholds = [
    1, // 2007
    5130, // 2008
    59489, // 2009
    224499, // 2010
    626609, // 2011
    1299678, // 2012
    2231102, // 2013
    3810183, // 2014
    5466373, // 2015
    7672151, // 2016
    9501617, // 2017
    11454549, // 2018
    13683105, // 2019
    15887198, // 2020
    20136967, // 2021
]; // IDs where they are the first for each year starting from 2007

function createUserQuery (year, modeId, i) : SelectQueryBuilder<User> {
    let query = User
        .createQueryBuilder("user")
        .innerJoin("user.beatmapsets", "beatmapset","beatmapset.approvedDate BETWEEN :start AND :end", { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) })
        .innerJoin("beatmapset.beatmaps", "beatmap", "beatmap.mode = :mode", { mode: modeId });
    if (i === yearIDthresholds.length - 1)
        query = query
            .andWhere(`user.osuUserid >= ${yearIDthresholds[i]}`);
    else
        query = query
            .andWhere(`user.osuUserid >= ${yearIDthresholds[i]} and user.osuUserid < ${yearIDthresholds[i + 1]}`);
    return query;
}

function valueToFixed (record: any, digits = 2): any {
    record.value = parseFloat(record.value).toFixed(digits);
    return record;
}

statisticsRouter.get("/beatmapsets", async (ctx) => {
    if (await ctx.cashed())
        return;

    const year = parseInt(ctx.query.year || new Date().getUTCFullYear());
    const modeString: string = ctx.query.mode || "standard";
    const modeId = ModeDivisionType[modeString];

    // Create loops for AR/OD/CS/HP/SR stats
    const [CSq, ARq, ODq, HPq, SRq]: [Promise<any>[], Promise<any>[], Promise<any>[], Promise<any>[], Promise<any>[]] = [[], [], [], [], []];
    for (let i = 0; i < 11; i++) {
        if (modeId === ModeDivisionType.mania) {
            if (i > 3 && i < 10)
                CSq.push(Beatmapset
                    .queryStatistic(year, modeId)
                    .andWhere(`beatmap.circleSize = ${i}`)
                    .select("COUNT(beatmap.circleSize)", "value")
                    .addSelect(`'${i} Keys'`, "constraint")
                    .orderBy("value", "DESC")
                    .getRawOne()
                );
        } else {
            CSq.push(Beatmapset
                .queryStatistic(year, modeId)
                .andWhere(`beatmap.circleSize between ${i} and ${i + 0.9}`)
                .select("COUNT(beatmap.circleSize)", "value")
                .addSelect(`'CS ${i} ${i !== 10 ? "- " + (i + 0.9) : ""}'`, "constraint")
                .orderBy("value", "DESC")
                .getRawOne()
            );
        }

        ARq.push(Beatmapset
            .queryStatistic(year, modeId)
            .andWhere(`beatmap.approachRate between ${i} and ${i + 0.9}`)
            .select("COUNT(beatmap.approachRate)", "value")
            .addSelect(`'AR ${i} ${i !== 10 ? "- " + (i + 0.9) : ""}'`, "constraint")
            .orderBy("value", "DESC")
            .getRawOne()
        );
        ODq.push(Beatmapset
            .queryStatistic(year, modeId)
            .andWhere(`beatmap.overallDifficulty between ${i} and ${i + 0.9}`)
            .select("COUNT(beatmap.overallDifficulty)", "value")
            .addSelect(`'OD ${i} ${i !== 10 ? "- " + (i + 0.9) : ""}'`, "constraint")
            .orderBy("value", "DESC")
            .getRawOne()
        );
        HPq.push(Beatmapset
            .queryStatistic(year, modeId)
            .andWhere(`beatmap.hpDrain between ${i} and ${i + 0.9}`)
            .select("COUNT(beatmap.hpDrain)", "value")
            .addSelect(`'HP ${i} ${i !== 10 ? "- " + (i + 0.9) : ""}'`, "constraint")
            .orderBy("value", "DESC")
            .getRawOne()
        );
        if (i === 10)
            SRq.push(Beatmapset
                .queryStatistic(year, modeId)
                .andWhere(`beatmap.totalSR >= 10`)
                .select("COUNT(beatmap.totalSR)", "value")
                .addSelect(`'10+ SR'`, "constraint")
                .orderBy("value", "DESC")
                .getRawOne()
            );
        else
            SRq.push(Beatmapset
                .queryStatistic(year, modeId)
                .andWhere(`beatmap.totalSR between ${i} and ${i + 0.9}`)
                .select("COUNT(beatmap.totalSR)", "value")
                .addSelect(`'${i} - ${i + 0.9} SR'`, "constraint")
                .orderBy("value", "DESC")
                .getRawOne()
            );
    }

    const [yearQ, mapsQ]: [Promise<any>[], Promise<any>[]] = [[], []];
    for (let i = 0; i < yearIDthresholds.length; i++) {
        if (i + 2007 > year)
            break;
        yearQ.push(Beatmapset
            .queryStatistic(year, modeId)
            .andWhere(`year(beatmapset.submitDate) = ${i + 2007}`)
            .select("count(distinct beatmapset.submitDate)", "value")
            .addSelect(`'Maps Submitted in ${i + 2007}'`, "constraint")
            .getRawOne()
        );

        let query = User
            .createQueryBuilder("user")
            .innerJoin("user.beatmapsets", "beatmapset","beatmapset.approvedDate BETWEEN :start AND :end", { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) })
            .innerJoin("beatmapset.beatmaps", "beatmap", "beatmap.mode = :mode", { mode: modeId });
        if (i === yearIDthresholds.length - 1)
            query = query
                .andWhere(`user.osuUserid >= ${yearIDthresholds[i]}`);
        else
            query = query
                .andWhere(`user.osuUserid >= ${yearIDthresholds[i]} and user.osuUserid < ${yearIDthresholds[i + 1]}`);

        mapsQ.push(query
            .select("count(distinct beatmapset.ID)", "value")
            .addSelect(`'Maps Ranked by ${i + 2007} Users'`, "constraint")
            .getRawOne()
        );
    }


    const query = createQueryBuilder()
        .from(sub => {
            return sub
                .from("beatmapset", "beatmapset")
                .innerJoin("beatmapset.creator", "creator")
                .innerJoin("beatmapset.beatmaps", "beatmap", "beatmap.mode = :mode", { mode: modeId })
                .where("beatmapset.approvedDate BETWEEN :start AND :end", { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) })
                .select("beatmapset.ID", "beatmapsetID")
                .addSelect("beatmap.ID", "beatmapID");
        }, "sub");
    const [
        totalSets,
        totalDiffs,

        // Difficulties
        totalEasies,
        totalMediums,
        totalHards,
        totalInsanes,
        totalExtras,
        totalExpertPlus,

        years,

        // CS AR OD HP SR
        CS,
        AR,
        OD,
        HP,
        SR,

        // Total sliders/circles
        totalSliders,
        avgSlidersPerMapset,
        avgSlidersPerDiff,

        totalCircles,
        avgCirclesPerMapset,
        avgCirclesPerDiff,

        setsToDifficulties,

        avgSR,

    ] = await Promise.all([
        // Total ranked
        query
            .select("COUNT(distinct sub.beatmapsetID)", "value")
            .addSelect("'Ranked Sets'", "constraint")
            .getRawOne(),
        query
            .select("COUNT(distinct sub.beatmapID)", "value")
            .addSelect("'Ranked Difficulties'", "constraint")
            .getRawOne(),

        // Difficulties
        Beatmapset
            .queryStatistic(year, modeId)
            .andWhere("beatmap.totalSR < 2")
            .select("COUNT(beatmap.totalSR)", "value")
            .addSelect("'Easy Difficulty Icons'", "constraint")
            .orderBy("value", "DESC")
            .getRawOne(),
        Beatmapset
            .queryStatistic(year, modeId)
            .andWhere("beatmap.totalSR >= 2 and beatmap.totalSR < 2.7")
            .select("COUNT(beatmap.totalSR)", "value")
            .addSelect("'Normal Difficulty Icons'", "constraint")
            .orderBy("value", "DESC")
            .getRawOne(),
        Beatmapset
            .queryStatistic(year, modeId)
            .andWhere("beatmap.totalSR >= 2.7 and beatmap.totalSR < 4")
            .select("COUNT(beatmap.totalSR)", "value")
            .addSelect("'Hard Difficulty Icons'", "constraint")
            .orderBy("value", "DESC")
            .getRawOne(),
        Beatmapset
            .queryStatistic(year, modeId)
            .andWhere("beatmap.totalSR >= 4 and beatmap.totalSR < 5.3")
            .select("COUNT(beatmap.totalSR)", "value")
            .addSelect("'Insane Difficulty Icons'", "constraint")
            .orderBy("value", "DESC")
            .getRawOne(),
        Beatmapset
            .queryStatistic(year, modeId)
            .andWhere("beatmap.totalSR >= 5.3 and beatmap.totalSR < 6.5")
            .select("COUNT(beatmap.totalSR)", "value")
            .addSelect("'Extra Difficulty Icons'", "constraint")
            .orderBy("value", "DESC")
            .getRawOne(),
        Beatmapset
            .queryStatistic(year, modeId)
            .andWhere("beatmap.totalSR >= 6.5")
            .select("COUNT(beatmap.totalSR)", "value")
            .addSelect("'Extra+ Difficulty Icons'", "constraint")
            .orderBy("value", "DESC")
            .getRawOne(),

        Promise.all(yearQ),

        // CS AR OD HP
        Promise.all(CSq),
        Promise.all(ARq),
        Promise.all(ODq),
        Promise.all(HPq),
        Promise.all(SRq),


        // Total Sliders
        Beatmapset
            .queryStatistic(year, modeId)
            .select("SUM(beatmap.sliders)", "value")
            .addSelect("'Sliders Ranked'", "constraint")
            .getRawOne(),

        // Avg Sliders per Mapset
        Beatmapset
            .queryStatistic(year, modeId)
            .select("SUM(beatmap.sliders)/COUNT(DISTINCT beatmap.beatmapsetID)", "value")
            .addSelect("'Sliders per Set'", "constraint")
            .getRawOne(),

        // Avg Sliders per Diff
        Beatmapset
            .queryStatistic(year, modeId)
            .select("SUM(beatmap.sliders)/COUNT(beatmap.ID)", "value")
            .addSelect("'Sliders per Diff'", "constraint")
            .getRawOne(),


        // Total Circles
        Beatmapset
            .queryStatistic(year, modeId)
            .select("SUM(beatmap.circles)", "value")
            .addSelect("'Circles Ranked'", "constraint")
            .getRawOne(),

        // Avg Circles per Mapset
        Beatmapset
            .queryStatistic(year, modeId)
            .select("SUM(beatmap.circles)/COUNT(DISTINCT beatmap.beatmapsetID)", "value")
            .addSelect("'Circles per Set'", "constraint")
            .getRawOne(),

        // Avg Circles per Diff
        Beatmapset
            .queryStatistic(year, modeId)
            .select("SUM(beatmap.circles)/COUNT(beatmap.ID)", "value")
            .addSelect("'Circles per Diff'", "constraint")
            .getRawOne(),

        // Ratio of Sets to Difficulties
        Beatmapset
            .queryStatistic(year, modeId)
            .select("COUNT(beatmap.ID)/COUNT(DISTINCT beatmap.beatmapsetID)", "value")
            .addSelect("'Diffs per Set'", "constraint")
            .getRawOne(),

        // Average SR
        Beatmapset
            .queryStatistic(year, modeId)
            .select("ROUND(AVG(totalSR), 2)", "value")
            .addSelect("'SR Ranked'", "constraint")
            .getRawOne(),
    ]);

    const statistics: Record<string, Statistic[]> = {
        totalRanked: [
            totalSets,
            totalDiffs,
        ],
        sliders: [totalSliders, valueToFixed(avgSlidersPerMapset), valueToFixed(avgSlidersPerDiff)],
        circles: [totalCircles, valueToFixed(avgCirclesPerMapset), valueToFixed(avgCirclesPerDiff)],
        difficulties: [
            valueToFixed(setsToDifficulties),
            totalEasies,
            totalMediums,
            totalHards,
            totalInsanes,
            totalExtras,
            totalExpertPlus,
        ],
        submitDates: years,
        starRatings: [valueToFixed(avgSR), ...SR],
        approachRate: AR,
        overallDifficulty: OD,
        hpDrain: HP,
    };

    if (modeId === ModeDivisionType.fruits || ModeDivisionType.standard)
        statistics.circleSize = CS;
    else if (modeId === ModeDivisionType.mania)
        statistics.keys = CS;

    ctx.body = statistics;
});

statisticsRouter.get("/mappers", async (ctx) => {
    if (await ctx.cashed())
        return;

    const year = parseInt(ctx.query.year || new Date().getUTCFullYear());
    const modeString: string = ctx.query.mode || "standard";
    const modeId = ModeDivisionType[modeString];

    const [yearQ, newyearQ, mapsQ]: [Promise<any>[], Promise<any>[], Promise<any>[]] = [[], [], []];
    for (let i = 0; i < yearIDthresholds.length; i++) {
        if (i + 2007 > year)
            break;

        yearQ.push(createUserQuery(year, modeId, i)
            .select("count(distinct user.osuUserid)", "value")
            .addSelect(`'${i + 2007} Users Ranking Sets'`, "constraint")
            .getRawOne()
        );

        newyearQ.push(createUserQuery(year, modeId, i)
            .andWhere(() => {
                const subQuery = Beatmapset
                    .createQueryBuilder("beatmapset")
                    .where(`year(beatmapset.approvedDate) < ${year}`)
                    .select("beatmapset.creatorID");
                return "user.ID not in (" + subQuery.getQuery() + ")";
            })
            .select("count(distinct user.osuUserid)", "value")
            .addSelect(`'${i + 2007} Users Ranking First Set'`, "constraint")
            .getRawOne()
        );

        // Maps Ranked by <YEAR> Users
        mapsQ.push(createUserQuery(year, modeId, i)
            .select("count(distinct beatmapset.ID)", "value")
            .addSelect(`'Maps Ranked by ${i + 2007} Users'`, "constraint")
            .getRawOne()
        );
    }

    const [
        uniqueMappers,
        newMappers,

        years,
        newYears,

        mapYears,
    ] = await Promise.all([
        Beatmapset
            .queryStatistic(year, modeId)
            .select("count(distinct creator.id)", "value")
            .addSelect("'Total Mappers Ranking Sets'", "constraint")
            .getRawOne(),

        Beatmapset
            .queryStatistic(year, modeId)
            .andWhere(qb => {
                let subQuery = qb
                    .subQuery()
                    .from(Beatmapset, "sub");
                subQuery = Beatmapset
                    .createQueryBuilder("beatmapset")
                    .where(`year(beatmapset.approvedDate) < ${year}`)
                    .select("beatmapset.creatorID");
                return "creator.ID not in (" + subQuery.getQuery() + ")";
            })
            .select("count(distinct creator.id)", "value")
            .addSelect("'Total Mappers Ranking First Set'", "constraint")
            .getRawOne(),

        Promise.all(yearQ),
        Promise.all(newyearQ),

        Promise.all(mapsQ),
    ]);

    const statistics: Record<string, Statistic[]> = {
        mappers: [
            uniqueMappers,
            newMappers,
            {
                constraint: "Percent of Mappers Ranking First Set",
                value: (newMappers.value / uniqueMappers.value * 100).toFixed(2) + "%",
            },
        ],
        bng: [
            getHistoryStat(year, modeString, "bns", "joined"),
            getHistoryStat(year, modeString, "bns", "left"),
        ],
        nat: [
            getHistoryStat(year, modeString, "nat", "joined"),
            getHistoryStat(year, modeString, "nat", "left"),
        ],
        newMapperAges: newYears,
        mapperAges: years,
        mapsPerMapperAges: mapYears,
    };

    ctx.body = statistics;
});

export default statisticsRouter;
