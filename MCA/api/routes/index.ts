import Router from "koa-router";
import { MCA } from "../../../CorsaceModels/MCA_AYIM/mca";
import { Category } from "../../../CorsaceModels/MCA_AYIM/category";
import { Beatmapset } from "../../../CorsaceModels/beatmapset";
import { getRepository } from "typeorm";
import { discordGuild } from "../../../CorsaceServer/discord";
import { Config } from "../../../config";
import { ModeDivision } from "../../../CorsaceModels/MCA_AYIM/modeDivision";

const indexRouter = new Router();
const config = new Config;
const modeStaff = config.discord.roles.mca;

indexRouter.get("/front", async (ctx) => {
    const newDate = new Date;

    try {
        const mca = await MCA.findOne(newDate.getUTCFullYear()-1);

        if (!mca)
            return ctx.body = { error: "There is no MCA for this year currently!" };

        const frontData = {};

        for (const mode of await ModeDivision.find()) {
            const beatmapCounter = getRepository(Beatmapset)
                .createQueryBuilder("beatmapset")
                .innerJoinAndSelect("beatmapset.beatmaps", "beatmap", mode.ID === 5 ? "beatmap.storyboard = :q" : "beatmap.mode = :q", { q: mode.ID === 5 ? true : mode.ID })
                .where("beatmapset.approvedDate BETWEEN :start AND :end", { start: `${mca.year}-01-01`, end: `${mca.year+1}-01-01` })
                .getCount();

            const [categories, beatmapCount, organizers] = await Promise.all([
                Category.find({ mca, mode }), 
                beatmapCounter,
                (await discordGuild()).members.cache.filter(x => x.roles.cache.has(modeStaff[mode.name])).map(x => x.user.username),
            ]);

            const categoryInfos = categories.map(x => x.getInfo());

            frontData[mode.name] = {
                categoryInfos,
                beatmapCount,
                organizers,
            };
        }

        ctx.body = { frontData };
    } catch (e) {
        if (e)
            ctx.body = { error: e };
    }
});

indexRouter.get("/phase", async (ctx) => {
    const newDate = new Date;

    try {
        const mca = await MCA.findOne(newDate.getUTCFullYear()-1);

        if (!mca)
            return ctx.body = { error: "There is no MCA for this year currently!" };

        let phase: string;
        let startDate: Date = newDate;
        let endDate: Date = newDate;
        if (newDate > mca.nomination.start && newDate < mca.nomination.end) {
            phase = "nominating";
            startDate = mca.nomination.start;
            endDate = mca.nomination.end;
        } else if (newDate > mca.voting.start && newDate < mca.voting.end) {
            phase = "voting";
            startDate = mca.voting.start;
            endDate = mca.voting.end;
        } else if (newDate > mca.results) {
            phase = "results";
        } else 
            return ctx.body = { error: "No phase currently", year: mca.year };

        ctx.body = { phase, startDate, endDate, year: mca.year };
    } catch (e) {
        if (e)
            ctx.body = { error: e };
    }
});

export default indexRouter;