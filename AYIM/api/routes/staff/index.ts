import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../../Server/middleware";
import { currentMCA } from "../../../../MCA-AYIM/api/middleware";

const staffRouter = new Router;

staffRouter.use(isLoggedInDiscord);
staffRouter.use(isStaff);
staffRouter.use(currentMCA);

// Endpoint to obtain current MCA and its info
staffRouter.get("/", async (ctx) => {
    if (await ctx.cashed())
        return;

    ctx.body = ctx.state.mca.getInfo();
});

export default staffRouter;
