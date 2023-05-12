import Router from "@koa/router";
import { cron } from "../../../cron";
import { CronJobType } from "../../../../Interfaces/cron";
import koaBasicAuth from "koa-basic-auth";
import { config } from "node-config-ts";

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

cronRouter.use(koaBasicAuth({
    name: config.interOpAuth.username,
    pass: config.interOpAuth.password,
}))

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

    await cron.add(type, triggerDate);
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

    await cron.remove(type, triggerDate);
    ctx.body = {
        success: true,
    };
});

export default cronRouter;