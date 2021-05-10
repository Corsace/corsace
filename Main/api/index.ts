import "reflect-metadata";
import { App } from "../../Server";
import mount from "koa-mount";
import discordRouter from "./routes/login/discord";
import osuRouter from "./routes/login/osu";
import userRouter from "./routes/user";

const app = new App();

app.koa.use(mount("/login/discord", discordRouter.routes()));
app.koa.use(mount("/login/osu", osuRouter.routes()));

app.koa.use(mount("/user", userRouter.routes()));

export default {
    path: "/api",
    handler: app.koa.callback(),
};