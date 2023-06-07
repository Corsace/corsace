import Router from "@koa/router";

const osuURIRouter = new Router();

osuURIRouter.get("/edit", (ctx) => {
    ctx.redirect(`osu://edit/${ctx.query.time}`);
});

export default osuURIRouter;