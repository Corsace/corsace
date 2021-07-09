import Router from "@koa/router";
import { hasNoTeam, isLoggedIn, isLoggedInDiscord, isRegistration, notOpenStaff } from "../../../Server/middleware";

const userRouter = new Router();

userRouter.get("/", isLoggedIn, async (ctx) => {
    ctx.body = await ctx.state.user.getInfo();
});

// Get list of invites
userRouter.get("/invites", isLoggedInDiscord, hasNoTeam, notOpenStaff, isRegistration, async (ctx) => {
    
});

// Accept target invite
userRouter.put("/accept", isLoggedInDiscord, hasNoTeam, notOpenStaff, isRegistration, async (ctx) => {

});

// Decline target invite
userRouter.put("/decline", isLoggedInDiscord, hasNoTeam, notOpenStaff, isRegistration, async (ctx) => {

});

export default userRouter;
