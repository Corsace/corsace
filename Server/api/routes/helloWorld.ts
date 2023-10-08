import Router from "@koa/router";
import { requestWithCorsaceContext } from "../../router";

const helloWorldRouter = new Router();

requestWithCorsaceContext<{ message: string }>(helloWorldRouter, "get", "/", (ctx) => {
    ctx.body = {
        success: true,
        message: "Hello World!",
    };
});

export default helloWorldRouter;
