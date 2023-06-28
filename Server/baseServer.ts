import "reflect-metadata";
import { config } from "node-config-ts";
import Koa from "koa";
import Mount from "koa-mount";

import helloWorldRouter from "./api/routes/helloWorld";

const koa = new Koa;
koa.keys = config.koaKeys;
koa.proxy = true;

// Error handler	
koa.use(async (ctx, next) => {	
    try {	
        if (ctx.originalUrl !== "/favicon.ico" && process.env.NODE_ENV === "development")	
            console.log("\x1b[33m%s\x1b[0m", ctx.originalUrl);

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

// Hello World!
koa.use(Mount("/", helloWorldRouter.routes()));
koa.use(Mount("/api", helloWorldRouter.routes()));

export default koa;