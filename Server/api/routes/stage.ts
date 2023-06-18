import Router from "@koa/router";

const stageRouter = new Router();

stageRouter.post("/matches", async (ctx) => {
    ctx.body = "Hello world!";
});

export default stageRouter;