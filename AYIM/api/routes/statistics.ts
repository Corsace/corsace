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

        // CS AR OD HP SR
        CS,
        AR,
        OD,
        HP,
        SR,
    ] = await Promise.all([
        // Total ranked
        query
            .select("COUNT(distinct sub.beatmapsetID)", "value")
            .addSelect("'Ranked Sets'", "constraint")
            .cache(true)
            .getRawOne(),
        query
            .select("COUNT(distinct sub.beatmapID)", "value")
            .addSelect("'Ranked Difficulties'", "constraint")
            .cache(true)
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

        // CS AR OD HP
        Promise.all(CSq),
        Promise.all(ARq),
        Promise.all(ODq),
        Promise.all(HPq),
        Promise.all(SRq),
    ]);

    const statistics: Record<string, Statistic[]> = {
        total_ranked: [
            totalSets,
            totalDiffs,
        ],
        total_difficulties: [
            totalEasies,
            totalMediums,
            totalHards,
            totalInsanes,
            totalExtras,
            totalExpertPlus,
        ],
        star_ratings: SR,
        approach_rate: AR,
        overall_difficulty: OD,
        hp_drain: HP,
    };

    if (modeId === ModeDivisionType.fruits || ModeDivisionType.standard)
        statistics.circle_size = CS;
    else if (modeId === ModeDivisionType.mania)
        statistics.keys = CS;

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
