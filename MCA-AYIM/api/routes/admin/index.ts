import Router from "@koa/router";
import { cache } from "../../../../Server/cache";
import { isCorsace, isLoggedInDiscord } from "../../../../Server/middleware";

const adminRouter = new Router;

adminRouter.use(isLoggedInDiscord);
adminRouter.use(isCorsace);

adminRouter.get("/reset", async (ctx) => {
    cache.reset();
    ctx.body = {
        success: "Success",
    };
});

export default adminRouter;