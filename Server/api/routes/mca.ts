import Router from "@koa/router";
import { config } from "node-config-ts";
import { Beatmapset } from "../../../Models/beatmapset";
import { Category } from "../../../Models/MCA_AYIM/category";
import { MCA } from "../../../Models/MCA_AYIM/mca";
import { ModeDivision } from "../../../Models/MCA_AYIM/modeDivision";
import { discordGuild } from "../../discord";
import { parseQueryParam } from "../../utils/query";

const mcaRouter = new Router();
const modeStaff = config.discord.roles.mca;

mcaRouter.get("/", async (ctx) => {
    if (await ctx.cashed())
        return;

    const mca = await MCA.findOne(parseQueryParam(ctx.query.year));

    if (mca)
        ctx.body = mca;
    else
        ctx.body = {error: "No MCA for this year exists!"};
});

mcaRouter.get("/all", async (ctx) => {
    const mca = await MCA.find();
    const mcaInfo = mca.map(x => x.getInfo());

    ctx.body = mcaInfo;
});

mcaRouter.get("/front", async (ctx) => {
    if (await ctx.cashed())
        return;

    const mca = ctx.query.year ? await MCA.findOne({ where: { year: parseInt(parseQueryParam(ctx.query.year)!.toString(), 10) }}) : null;

    if (!mca)
        return ctx.body = { error: "There is no MCA for this year currently!" };

    const frontData = {};

    const modes = await ModeDivision.find();
    await Promise.all(modes.map(mode => (async () => {
        const beatmapCounter = Beatmapset
            .createQueryBuilder("beatmapset")
            .innerJoinAndSelect("beatmapset.beatmaps", "beatmap", mode.ID === 5 ? "beatmap.storyboard = :q" : "beatmap.mode = :q", { q: mode.ID === 5 ? true : mode.ID })
            .where("beatmapset.approvedDate BETWEEN :start AND :end", { start: `${mca.year}-01-01`, end: `${mca.year + 1}-01-01` })
            .getCount();

        const [categories, beatmapCount, organizers] = await Promise.all([
            Category.find({ 
                where: {
                    mca: {
                        year: mca.year,
                    },
                    mode: {
                        ID: mode.ID,
                    },
                },
            }), 
            beatmapCounter,
            (await discordGuild()).members.cache.filter(x => x.roles.cache.has(modeStaff[mode.name])).map(x => x.nickname ?? x.user.username),
        ]);

        const categoryInfos = categories.map(x => x.getCondensedInfo());

        frontData[mode.name] = {
            categoryInfos,
            beatmapCount,
            organizers,
        };
    })()));

    ctx.body = { frontData };
});

export default mcaRouter;
