import "reflect-metadata";
import { App } from "../../Server";
import mount from "koa-mount";
import UserRouter from "./routes/user";
import commentsRouter from "./routes/comments";
import commentsReviewRouter from "./routes/staff/comments";
import usersRouter from "./routes/staff/users";
import recordsRouter from "./routes/records";
import statisticsRouter from "./routes/statistics";
import staffRouter from "./routes/staff";

const app = new App("ayim");

app.koa.use(mount("/records", recordsRouter.routes()));
app.koa.use(mount("/statistics", statisticsRouter.routes()));
app.koa.use(mount("/user", UserRouter.routes()));
app.koa.use(mount("/comments", commentsRouter.routes()));
app.koa.use(mount("/staff", staffRouter.routes()));
app.koa.use(mount("/staff/comments", commentsReviewRouter.routes()));
app.koa.use(mount("/staff/users", usersRouter.routes()));

export default {
    path: "/api",
    handler: app.koa.callback(),
};
