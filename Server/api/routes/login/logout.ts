import { CorsaceRouter } from "../../../corsaceRouter";
import { isLoggedIn } from "../../../middleware";

const logoutRouter  = new CorsaceRouter();

logoutRouter.get("/", isLoggedIn, async (ctx) => {
    if (ctx.isAuthenticated()) {
        await ctx.logout();
        ctx.redirect("back");
    } else {
        ctx.body = { error: "Unable to logout!" };
        ctx.throw(401);
    }
});

export default logoutRouter;