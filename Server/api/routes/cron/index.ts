import Router from "@koa/router";
import koaBasicAuth from "koa-basic-auth";
import { ParameterizedContext, Next } from "koa";
import { cron } from "../../../cron";
import { CronJobType } from "../../../../Interfaces/cron";
import { config } from "node-config-ts";

async function validateData (ctx: ParameterizedContext, next: Next) {
    const body = ctx.request.body;

    if (body.type === undefined || body.date === undefined) {
        ctx.body = {
            success: false,
            error: "Missing data",
        };
        return;
    }
        
    const { type, date }: { type: number, date: number } = body;

    const triggerDate = new Date(date);
    if (isNaN(triggerDate.getTime()) || triggerDate.getTime() < Date.now()) {
        ctx.body = {
            success: false,
            error: "Invalid date",
        };
        return;
    }

    if (CronJobType[type] === undefined) {
        ctx.body = {
            success: false,
            error: "Invalid type",
        };
        return;
    }

    ctx.state.cronJob = {
        type,
        date: triggerDate,
    };

    await next();
}

const cronRouter = new Router();

cronRouter.use(koaBasicAuth({
    name: config.interOpAuth.username,
    pass: config.interOpAuth.password,
}))

cronRouter.get("/", async (ctx) => {
    ctx.body = cron.listJobs();
});

cronRouter.post("/add", validateData, async (ctx) => {
    const { type, date } = ctx.state.cronJob;

    await cron.add(type, date);
    ctx.body = {
        success: true,
    };
});

cronRouter.post("/remove", validateData, async (ctx) => {
    const { type, date } = ctx.state.cronJob;

    await cron.remove(type, date);
    ctx.body = {
        success: true,
    };
});

export default cronRouter;