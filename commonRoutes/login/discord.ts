import Router from 'koa-router';
import passport from "koa-passport";

const discordRouter = new Router();

discordRouter.get("/", passport.authenticate("discord", { scope: ["identify", "guilds.join"]}))
discordRouter.get("/callback", async (ctx) => {
    return passport.authenticate("discord", { scope: ["identify", "guilds.join"], failureRedirect: "/" }, () => {
        ctx.redirect('/');
    })(ctx)
})

export default discordRouter;