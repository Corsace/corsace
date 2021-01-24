import "reflect-metadata";
import { App } from "../../Server";
import Mount from "koa-mount";
import mcaRouter from "../../MCA-AYIM/api/routes/mca";
import userRouter from "../../MCA-AYIM/api/routes/user";
import nominationsRouter from "./routes/nominations";
import votingRouter from "./routes/voting";
import indexRouter from "./routes";
import adminRouter from "./routes/admin/index";
import adminCategoriesRouter from "./routes/admin/categories";
import adminYearsRouter from "./routes/admin/years";
import adminResultsRouter from "./routes/admin/results";
import guestRequestRouter from "./routes/guestRequests";
import staffRouter from "./routes/staff/index";
import staffNominationsRouter from "./routes/staff/nominations";
import staffRequestsRouter from "./routes/staff/requests";

const app = new App("mca");

app.koa.use(Mount("/", indexRouter.routes()));
app.koa.use(Mount("/mca", mcaRouter.routes()));

app.koa.use(Mount("/user", userRouter.routes()));
app.koa.use(Mount("/guestRequests", guestRequestRouter.routes()));

app.koa.use(Mount("/nominating", nominationsRouter.routes()));
app.koa.use(Mount("/voting", votingRouter.routes()));

app.koa.use(Mount("/staff", staffRouter.routes()));
app.koa.use(Mount("/staff/nominations", staffNominationsRouter.routes()));
app.koa.use(Mount("/staff/requests", staffRequestsRouter.routes()));
app.koa.use(Mount("/admin", adminRouter.routes()));
app.koa.use(Mount("/admin/results", adminResultsRouter.routes()));
app.koa.use(Mount("/admin/categories", adminCategoriesRouter.routes()));
app.koa.use(Mount("/admin/years", adminYearsRouter.routes()));

export default {
    path: "/api",
    handler: app.koa.callback(),
};
