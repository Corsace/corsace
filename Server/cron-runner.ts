import "reflect-metadata";
import { config } from "node-config-ts";
import baseServer from "./baseServer";
import koaBody from "koa-body";
import Mount from "koa-mount";
import gracefulShutdown from "http-graceful-shutdown";

import cronRouter from "./api/routes/cron";

import ormConfig from "../ormconfig";
import { cron } from "./cron";
import state from "./cron/state";
import { discordClient } from "./discord";

const koa = baseServer;

koa.use(koaBody());

// General

/// Cron
koa.use(Mount("/api/cron", cronRouter.routes()));

let httpShutdown: () => Promise<void> | undefined;

// Only start listening if this file is the entry point.
if(require.main === module)
    ormConfig.initialize()
        .then(async (connection) => {
            console.log(`Connected to the ${connection.options.database} database!`);
            await cron.initialize();
            const server = koa.listen(config.cronRunner.port);
            httpShutdown = gracefulShutdown(server, {
                signals: "", // leave signals handling to us
                onShutdown: async () => {
                    state.httpServerShutDown = true;
                    console.log("Done handling all API requests.");
                    maybeShutdown();
                },
                forceExit: false,
            });
        })
        .catch((error) => console.log("An error has occurred in connecting.", error));

const maybeShutdown = () => {
    if (!state.shuttingDown || !state.httpServerShutDown)
        return;

    if (state.runningJobs > 0) {
        console.log(`Waiting for ${state.runningJobs} jobs to finish...`);
    } else {
        console.log("No running job.");
        ormConfig.destroy();
        discordClient.destroy();
        console.log("Disconnected from every service, shutting down now.");
        process.exit();
    }
};

const onTerminationSignal = (signal: NodeJS.Signals) => {
    // HTTP server not initiated yet, simply exiting.
    if (!httpShutdown) {
        process.exit();
    }

    if (state.shuttingDown) {
        console.warn(`Received ${signal}, but already shutting down. Ignoring.`);
        return;
    }
    
    state.shuttingDown = true;
    console.log(`Received shutdown signal (${signal}), initiating shutdown sequence.`);
    cron.stopAllJobs();
    httpShutdown();
};

process.on("SIGTERM", () => onTerminationSignal("SIGTERM"));
process.on("SIGINT", () => onTerminationSignal("SIGINT"));

export { maybeShutdown };
