import Router from "@koa/router";
import { MCA } from "../../../Models/MCA_AYIM/mca";
import { Category } from "../../../Models/MCA_AYIM/category";
import { Beatmapset } from "../../../Models/beatmapset";
import { discordGuild } from "../../../Server/discord";
import { config } from "node-config-ts";
import { ModeDivision } from "../../../Models/MCA_AYIM/modeDivision";

const indexRouter = new Router();
const modeStaff = config.discord.roles.mca;

indexRouter.get("/front", async (ctx) => {
    if (await ctx.cashed())
        return;

    const mca = await MCA.findOne(ctx.query.year);

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
            Category.find({ mca, mode }), 
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

export default indexRouter;