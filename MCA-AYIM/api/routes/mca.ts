import Router from "@koa/router";
import { MCA } from "../../../Models/MCA_AYIM/mca";
import { parseQueryParam } from "../../../Server/utils/query";

const mcaRouter = new Router();

mcaRouter.get("/", async (ctx) => {
    if (await ctx.cashed())
        return;

    const mca = ctx.query.year ? await MCA.findOne({ where: { year: parseInt(parseQueryParam(ctx.query.year)!.toString(), 10) }}) : null;

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

export default mcaRouter;
