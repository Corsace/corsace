import Router from "@koa/router";
import { MCA } from "../../../Models/MCA_AYIM/mca";

const mcaRouter = new Router();

mcaRouter.get("/", async (ctx) => {
    const mca = await MCA.findOne(ctx.query.year);

    if (mca)
        ctx.body = mca;
    else
        ctx.body = {error: "No MCA for this year exists!"};
});

export default mcaRouter;
