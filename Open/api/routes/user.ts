import Router from "@koa/router";
import { isLoggedIn } from "../../../Server/middleware";

const userRouter = new Router();

userRouter.get("/", isLoggedIn, async (ctx) => {
    ctx.body = await ctx.state.user.getInfo();
});

export default userRouter;
