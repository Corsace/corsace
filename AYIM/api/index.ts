import "reflect-metadata";
import { App } from "../../Server";
import mount from "koa-mount";
import loginRouter from "../../Server/login";
import mcaRouter from "../../MCA-AYIM/api/routes/mca";
import userRouter from "../../MCA-AYIM/api/routes/user";
import adminRouter from "../../MCA-AYIM/api/routes/admin";
import adminCategoriesRouter from "../../MCA-AYIM/api/routes/admin/categories";
import adminYearsRouter from "../../MCA-AYIM/api/routes/admin/years";
import commentsRouter from "./routes/comments";
import commentsReviewRouter from "./routes/staff/comments";
import usersRouter from "./routes/staff/users";
import staffRouter from "./routes/staff";
import recordsRouter from "./routes/records";
import statisticsRouter from "./routes/statistics";
import mappersRouter from "./routes/mappers";

const app = new App();

app.koa.use(mount("/login", loginRouter.routes()));
app.koa.use(mount("/mca", mcaRouter.routes()));
app.koa.use(mount("/user", userRouter.routes()));

app.koa.use(mount("/records", recordsRouter.routes()));
app.koa.use(mount("/statistics", statisticsRouter.routes()));
app.koa.use(mount("/mappers", mappersRouter.routes()));
app.koa.use(mount("/comments", commentsRouter.routes()));

app.koa.use(mount("/staff", staffRouter.routes()));
app.koa.use(mount("/staff/comments", commentsReviewRouter.routes()));
app.koa.use(mount("/staff/users", usersRouter.routes()));

app.koa.use(mount("/admin", adminRouter.routes()));
app.koa.use(mount("/admin/years", adminCategoriesRouter.routes()));
app.koa.use(mount("/admin/years", adminYearsRouter.routes()));

export default {
    path: "/api",
    handler: app.koa.callback(),
};
