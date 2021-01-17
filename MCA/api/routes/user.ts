import Router from "@koa/router";
import { isLoggedIn } from "../../../Server/middleware";

const UserRouter = new Router();

UserRouter.get("/", isLoggedIn, async (ctx) => {
    ctx.body = await ctx.state.user.getMCAInfo();
});

export default UserRouter;
