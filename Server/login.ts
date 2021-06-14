import Router from "@koa/router";
import { config } from "node-config-ts";

const loginRouter = new Router();

loginRouter.get("/discord", async (ctx) => {
    const baseURL = config[ctx.query.site] ? config[ctx.query.site].publicUrl : config.corsace.publicUrl;
    ctx.redirect(config.corsace.publicUrl + "/api/login/discord?redirect=" + baseURL + ctx.query.redirect);
});

loginRouter.get("/osu", async (ctx) => {
    const baseURL = config[ctx.query.site] ? config[ctx.query.site].publicUrl : config.corsace.publicUrl;
    ctx.redirect(config.corsace.publicUrl + "/api/login/osu?redirect=" + baseURL + ctx.query.redirect);
});

export default loginRouter;
