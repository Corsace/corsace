import "reflect-metadata";
import { App } from "../../Server";
import mount from "koa-mount";
import loginRouter from "../../Server/login";
import userRouter from "./routes/user";

const app = new App();

app.koa.use(mount("/login", loginRouter.routes()));
app.koa.use(mount("/user", userRouter.routes()));

export default {
    path: "/api",
    handler: app.koa.callback(),
};