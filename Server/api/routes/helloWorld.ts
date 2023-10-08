import { CorsaceRouter } from "../../corsaceRouter";

const helloWorldRouter = new CorsaceRouter();

helloWorldRouter.$get<{ message: string }>("/", (ctx) => {
    ctx.body = {
        success: true,
        message: "Hello World!",
    };
});

export default helloWorldRouter;
