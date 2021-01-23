import "reflect-metadata";
import { App } from "../../Server";
import mount from "koa-mount";
import mcaRouter from "../../MCA-AYIM/api/routes/mca";
import userRouter from "../../MCA-AYIM/api/routes/user";
import commentsRouter from "./routes/comments";
import commentsReviewRouter from "./routes/staff/comments";
import usersRouter from "./routes/staff/users";
import recordsRouter from "./routes/records";
import statisticsRouter from "./routes/statistics";
import mappersRouter from "./routes/mappers";

const app = new App("ayim");

app.koa.use(mount("/mca", mcaRouter.routes()));
app.koa.use(mount("/user", userRouter.routes()));

app.koa.use(mount("/records", recordsRouter.routes()));
app.koa.use(mount("/statistics", statisticsRouter.routes()));
app.koa.use(mount("/mappers", mappersRouter.routes()));
app.koa.use(mount("/comments", commentsRouter.routes()));

app.koa.use(mount("/staff/comments", commentsReviewRouter.routes()));
app.koa.use(mount("/staff/users", usersRouter.routes()));

export default {
    path: "/api",
    handler: app.koa.callback(),
};
