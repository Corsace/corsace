import Router from "@koa/router";

const helloWorldRouter = new Router();

helloWorldRouter.get("/", (ctx) => {
    ctx.body = "Hello World!";
});

export default helloWorldRouter;
