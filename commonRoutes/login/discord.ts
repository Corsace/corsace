import Router from 'koa-router';
import * as passport from "passport";

const discordRouter = new Router();

discordRouter.get("/", async (ctx) => {
    passport.authenticate("discord", { scope: ["identify", "guilds.join"]})
})
discordRouter.get("/callback", async (ctx) => {
    passport.authenticate("discord", { failureRedirect: "/" }), (req, res) => res.redirect("/")
})

export default discordRouter;