import Router from "@koa/router";
import { Statistic } from "../../../Interfaces/records";
import { Beatmapset } from "../../../Models/beatmapset";
import { MCAEligibility } from "../../../Models/MCA_AYIM/mcaEligibility";
import { ModeDivisionType } from "../../../Models/MCA_AYIM/modeDivision";

const statisticsRouter = new Router();

statisticsRouter.get("/beatmapsets", async (ctx) => {
    const year = parseInt(ctx.query.year || new Date().getFullYear());
    const modeString: string = ctx.query.mode || "standard";
    const modeId = ModeDivisionType[modeString];

    const [minApproachRate, maxApproachRate, overallDifficulty, minHpDrain, maxHpDrain, maxCircleSize, minCircleSize] = await Promise.all([
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

    const eligibilityQuery = MCAEligibility
        .createQueryBuilder("eligibility");

    switch (modeId) {
        case ModeDivisionType.standard:
            eligibilityQuery.where("eligibility.standard = 1");
            break;
        case ModeDivisionType.taiko:
            eligibilityQuery.where("eligibility.taiko = 1");
            break;
        case ModeDivisionType.mania:
            eligibilityQuery.where("eligibility.mania = 1");
            break;
        case ModeDivisionType.fruits:
            eligibilityQuery.where("eligibility.fruits = 1");
            break;
        case ModeDivisionType.storyboard:
            eligibilityQuery.where("eligibility.storyboard = 1");
            break;
        default:
            return ctx.body = {
                error: "Invalid request",
            };
    }

    const [uniqueMappers] = await Promise.all([
        eligibilityQuery
            .andWhere("eligibility.year = :year", { year })
            .select("COUNT(eligibility.ID)", "value")
            .addSelect("'mappers'", "constraint")
            .orderBy("value", "DESC")
            .limit(1)
            .cache(true)
            .getRawOne(),
        
    ]);

    const statistics: Record<string, Statistic[]> = {
        uniqueMappers: [uniqueMappers],
    };

    ctx.body = statistics;
});

export default statisticsRouter;
