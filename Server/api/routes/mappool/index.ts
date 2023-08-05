import Router from "@koa/router";

const mappoolRouter = new Router();

mappoolRouter.get("/", async (ctx) => {
    ctx.body = {
        success: true,
    };
});

export default mappoolRouter;