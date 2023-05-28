import "reflect-metadata";
import { config } from "node-config-ts";
import Koa from "koa";
import BodyParser from "koa-bodyparser";
import Mount from "koa-mount";

import cronRouter from "./api/routes/cron";
import helloWorldRouter from "./api/routes/helloWorld";

import ormConfig from "../ormconfig";
import { cron } from "./cron";

const koa = new Koa;

koa.keys = config.koaKeys;
koa.proxy = true;
koa.use(BodyParser());

// Error handler
koa.use(async (ctx, next) => {
    try {
        if (ctx.originalUrl !== "/favicon.ico" && process.env.NODE_ENV === "development") {
            console.log("\x1b[33m%s\x1b[0m", ctx.originalUrl);
        }

        await next();
    } catch (err: any) {
        ctx.status = err.status || 500;

        if (ctx.status >= 500) {
            ctx.body = { 
                error: "Something went wrong!",
                status: ctx.status,
            };            
            console.log(err);
            return;
        }

        ctx.body = { 
            error: err.message,
            status: ctx.status,
        };
    }
});

// General

/// Cron
koa.use(Mount("/api/cron", cronRouter.routes()));

// Hello World!
koa.use(Mount("/", helloWorldRouter.routes()));
koa.use(Mount("/api", helloWorldRouter.routes()));

ormConfig.initialize()
    .then(async (connection) => {
        console.log(`Connected to the ${connection.options.database} database!`);
        await cron.initialize();
        koa.listen(config.cronRunner.port);
    })
    .catch((error) => console.log("An error has occurred in connecting.", error));
