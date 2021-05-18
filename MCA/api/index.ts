import "reflect-metadata";
import { App } from "../../Server";
import mount from "koa-mount";
import loginRouter from "../../MCA-AYIM/api/routes/login";
import mcaRouter from "../../MCA-AYIM/api/routes/mca";
import userRouter from "../../MCA-AYIM/api/routes/user";
import adminCategoriesRouter from "../../MCA-AYIM/api/routes/admin/categories";
import adminYearsRouter from "../../MCA-AYIM/api/routes/admin/years";
import adminResultsRouter from "../../MCA-AYIM/api/routes/admin/results";
import nominatingRouter from "./routes/nominating";
import votingRouter from "./routes/voting";
import indexRouter from "./routes";
import guestRequestRouter from "./routes/guestRequests";
import staffRouter from "./routes/staff/index";
import staffNominationsRouter from "./routes/staff/nominations";
import staffRequestsRouter from "./routes/staff/requests";

const app = new App();

app.koa.use(mount("/", indexRouter.routes()));
app.koa.use(mount("/login", loginRouter.routes()));
app.koa.use(mount("/mca", mcaRouter.routes()));

app.koa.use(mount("/user", userRouter.routes()));
app.koa.use(mount("/guestRequests", guestRequestRouter.routes()));

app.koa.use(mount("/nominating", nominatingRouter.routes()));
app.koa.use(mount("/voting", votingRouter.routes()));

app.koa.use(mount("/staff", staffRouter.routes()));
app.koa.use(mount("/staff/nominations", staffNominationsRouter.routes()));
app.koa.use(mount("/staff/requests", staffRequestsRouter.routes()));

app.koa.use(mount("/admin/results", adminResultsRouter.routes()));
app.koa.use(mount("/admin/years", adminCategoriesRouter.routes()));
app.koa.use(mount("/admin/years", adminYearsRouter.routes()));

export default {
    path: "/api",
    handler: app.koa.callback(),
};
