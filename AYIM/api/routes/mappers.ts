import Router from "@koa/router";
import { User } from "../../../Models/user";

const mappersRouter = new Router();

mappersRouter.get("/search", async (ctx) => {
    const users = await User.basicSearch(ctx.query);

    ctx.body = users;
});

export default mappersRouter;
