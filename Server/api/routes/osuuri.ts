import { CorsaceRouter } from "../../corsaceRouter";

const osuURIRouter = new CorsaceRouter();

osuURIRouter.get("/edit", (ctx) => {
    ctx.redirect(`osu://edit/${ctx.query.time}`);
});

export default osuURIRouter;