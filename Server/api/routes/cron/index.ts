import Router from "@koa/router";
import { cron } from "../../../cron";
import { CronJobType } from "../../../../Interfaces/cron";

function validateData(body: any) {
    if (body.type === undefined || body.date === undefined)
        return "Missing data";
        
    const { type, date }: { type: number, date: number } = body;

    const triggerDate = new Date(date);
    if (isNaN(triggerDate.getTime()) || triggerDate.getTime() < Date.now())
        return "Invalid date";

    if (CronJobType[type] === undefined)
        return "Invalid type";

    return { type, triggerDate };
}

const cronRouter = new Router();

cronRouter.get("/", async (ctx) => {
    ctx.body = cron.listJobs();
});

cronRouter.post("/add", async (ctx) => {
    const data = validateData(ctx.request.body);
    if (typeof data === "string")
        return ctx.body = {
            success: false,
            error: data,
        };

    const { type, triggerDate } = data;

    cron.add(type, triggerDate);
    ctx.body = {
        success: true,
    };
});

cronRouter.post("/remove", async (ctx) => {
    const data = validateData(ctx.request.body);
    if (typeof data === "string")
        return ctx.body = {
            success: false,
            error: data,
        };

    const { type, triggerDate } = data;

    cron.remove(type, triggerDate);
    ctx.body = {
        success: true,
    };
});

export default cronRouter;