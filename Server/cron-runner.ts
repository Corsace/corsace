import "reflect-metadata";
import { config } from "node-config-ts";
import baseServer from "./baseServer";
import koaBody from "koa-body";
import Mount from "koa-mount";

import cronRouter from "./api/routes/cron";

import ormConfig from "../ormconfig";
import { cron } from "./cron";

const koa = baseServer;

koa.use(koaBody());

// General

/// Cron
koa.use(Mount("/api/cron", cronRouter.routes()));

ormConfig.initialize()
    .then(async (connection) => {
        console.log(`Connected to the ${connection.options.database} database!`);
        await cron.initialize();
        koa.listen(config.cronRunner.port);
    })
    .catch((error) => console.log("An error has occurred in connecting.", error));
