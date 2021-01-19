import Router from "@koa/router";
import { BeatmapsetStatistic } from "../../../Interfaces/records";
import { Beatmapset } from "../../../Models/beatmapset";
import { ModeDivisionType } from "../../../Models/MCA_AYIM/modeDivision";

const statisticsRouter = new Router();

statisticsRouter.get("/beatmapsets", async (ctx) => {
    const year = parseInt(ctx.query.year || new Date().getFullYear());
    const modeString: string = ctx.query.mode || "standard";
    const modeId = ModeDivisionType[modeString];

    const [minApproachRate, maxApproachRate, overallDifficulty, minCircleSize, maxCircleSize] = await Promise.all([
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

    const records: Record<string, BeatmapsetStatistic[]> = {
        approachRate: [
            minApproachRate,
            maxApproachRate,
        ],
        overallDifficulty: [overallDifficulty],
        circleSize: [
            minCircleSize,
            maxCircleSize,
        ],
    };

    ctx.body = records;
});

export default statisticsRouter;
