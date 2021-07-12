import Router from "@koa/router";
import { isLoggedInDiscord, isStaff } from "../../../../Server/middleware";
import { validatePhaseYear } from "../../../../MCA-AYIM/api/middleware";

const staffRouter = new Router;

staffRouter.use(isLoggedInDiscord);
staffRouter.use(isStaff);

// Endpoint to obtain current MCA and its info
staffRouter.get("/:year", validatePhaseYear, async (ctx) => {
    if (await ctx.cashed())
        return;

    ctx.body = ctx.state.mca.getInfo();
});

export default staffRouter;
