import Router from "@koa/router";
import { MCA } from "../../../Models/MCA_AYIM/mca";

const mcaRouter = new Router();

mcaRouter.get("/", async (ctx) => {
    const mca = await MCA.findOneOrFail(ctx.query.year);

    ctx.body = mca;
});

export default mcaRouter;
