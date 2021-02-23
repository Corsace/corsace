import Router from "@koa/router";
import { Config } from "../../../config";

const loginRouter = new Router();
const config = new Config;

loginRouter.get("/discord", async (ctx) => {
    const baseURL = config[ctx.query.site] ? config[ctx.query.site].publicURL : config.corsace.publicURL;
    ctx.redirect(config.corsace.publicURL + "/api/login/discord?redirect=" + baseURL + ctx.query.redirect);
});

loginRouter.get("/osu", async (ctx) => {
    const baseURL = config[ctx.query.site] ? config[ctx.query.site].publicURL : config.corsace.publicURL;
    ctx.redirect(config.corsace.publicURL + "/api/login/osu?redirect=" + baseURL + ctx.query.redirect);
});

export default loginRouter;
