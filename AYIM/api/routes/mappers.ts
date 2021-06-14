import Router from "@koa/router";
import { User } from "../../../Models/user";

const mappersRouter = new Router();

mappersRouter.get("/search", async (ctx) => {
    if (!ctx.query.year)
        return ctx.body = {
            error: "No year given!",
        }

    if (/\d+/.test(ctx.query.skip))
        ctx.query.skip = parseInt(ctx.query.skip);
    else
        ctx.query.skip = 0;

    ctx.body = await User.basicSearch(ctx.query);
});

export default mappersRouter;
