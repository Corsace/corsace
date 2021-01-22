import Router from "@koa/router";
import { createQueryBuilder } from "typeorm";
import { Statistic } from "../../../Interfaces/records";
import { Beatmapset } from "../../../Models/beatmapset";
import { MCAEligibility } from "../../../Models/MCA_AYIM/mcaEligibility";
import { ModeDivisionType } from "../../../Models/MCA_AYIM/modeDivision";

const statisticsRouter = new Router();

statisticsRouter.get("/beatmapsets", async (ctx) => {
    const year = parseInt(ctx.query.year || new Date().getFullYear());
    const modeString: string = ctx.query.mode || "standard";
    const modeId = ModeDivisionType[modeString];

    const [totalRanked, minApproachRate, maxApproachRate, overallDifficulty, minHpDrain, maxHpDrain, maxCircleSize, minCircleSize] = await Promise.all([
        createQueryBuilder()
            .from(sub => {
                return sub
                    .from("beatmapset", "beatmapset")
                    .innerJoin("beatmapset.creator", "creator")
                    .innerJoin("beatmapset.beatmaps", "beatmap", "beatmap.mode = :mode", { mode: modeId })
                    .where("beatmapset.approvedDate BETWEEN :start AND :end", { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) })
                    .select("beatmapset.ID", "beatmapsetID")
                    .groupBy("beatmapset.ID");
            }, "sub")
            .select("COUNT(sub.beatmapsetID)", "value")
            .addSelect("'ranked'", "constraint")
            .cache(true)
            .getRawOne(),

        Beatmapset
            .queryStatistic(year, modeId)
            .andWhere("beatmap.approachRate = 10")
            .select("COUNT(beatmap.approachRate)", "value")
            .addSelect("'AR 10'", "constraint")
            .orderBy("value", "DESC")
            .getRawOne(),

        Beatmapset
            .queryStatistic(year, modeId)
            .andWhere("beatmap.approachRate = 1")
            .select("COUNT(beatmap.approachRate)", "value")
            .addSelect("'AR 1'", "constraint")
            .orderBy("value", "DESC")
            .getRawOne(),

        Beatmapset
            .queryStatistic(year, modeId)
            .andWhere("beatmap.overallDifficulty = 10")
            .select("COUNT(beatmap.overallDifficulty)", "value")
            .addSelect("'OD 10'", "constraint")
            .orderBy("value", "DESC")
            .getRawOne(),

        Beatmapset
            .queryStatistic(year, modeId)
            .andWhere("beatmap.hpDrain = 0")
            .select("COUNT(beatmap.hpDrain)", "value")
            .addSelect("'HP 0'", "constraint")
            .orderBy("value", "DESC")
            .getRawOne(),

        Beatmapset
            .queryStatistic(year, modeId)
            .andWhere("beatmap.hpDrain = 9")
            .select("COUNT(beatmap.hpDrain)", "value")
            .addSelect("'HP 9'", "constraint")
            .orderBy("value", "DESC")
            .getRawOne(),

        Beatmapset
            .queryStatistic(year, modeId)
            .andWhere("beatmap.circleSize = 2")
            .select("COUNT(beatmap.circleSize)", "value")
            .addSelect("'CS 2'", "constraint")
            .orderBy("value", "DESC")
            .getRawOne(),

        Beatmapset
            .queryStatistic(year, modeId)
            .andWhere("beatmap.circleSize = 7")
            .select("COUNT(beatmap.circleSize)", "value")
            .addSelect("'CS 7'", "constraint")
            .orderBy("value", "DESC")
            .getRawOne(),
    ]);

    const statistics: Record<string, Statistic[]> = {
        totalRanked: [totalRanked],
        approachRate: [
            minApproachRate,
            maxApproachRate,
        ],
        overallDifficulty: [overallDifficulty],
        hpDrain: [
            minHpDrain, 
            maxHpDrain,
        ],
        circleSize: [
            minCircleSize,
            maxCircleSize,
        ],
    };

    ctx.body = statistics;
});

statisticsRouter.get("/mappers", async (ctx) => {
    const year = parseInt(ctx.query.year || new Date().getFullYear());
    const modeString: string = ctx.query.mode || "standard";
    const modeId = ModeDivisionType[modeString];

    const [uniqueMappers, newMappers] = await Promise.all([
        MCAEligibility
            .whereMode(modeId)
            .andWhere("eligibility.year = :year", { year })
            .select("COUNT(eligibility.ID)", "value")
            .addSelect("'mappers'", "constraint")
            .cache(true)
            .getRawOne(),

        MCAEligibility
            .whereMode(modeId)
            .andWhere("eligibility.year = :year", { year })
            .andWhere(qb => {
                let subQuery = qb
                    .subQuery()
                    .from(MCAEligibility, "sub");

                subQuery = MCAEligibility.whereMode(modeId, subQuery);
                subQuery
                    .andWhere("sub.year != :year", { year })
                    .select("sub.userID", "userID");
                
                return "eligibility.userID NOT IN " + subQuery.getQuery();
            })
            .select("COUNT(eligibility.ID)", "value")
            .addSelect("'new mappers'", "constraint")
            .cache(true)
            .getRawOne(),
    ]);

    const statistics: Record<string, Statistic[]> = {
        uniqueMappers: [uniqueMappers],
        newMappers: [newMappers],
    };

    ctx.body = statistics;
});

export default statisticsRouter;
