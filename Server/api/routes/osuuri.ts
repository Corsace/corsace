import Router from "@koa/router";

const osuURIRouter = new Router();

osuURIRouter.get("/edit", async (ctx) => {
    ctx.redirect(`osu://edit/${ctx.query.time}`);
});

export default osuURIRouter;