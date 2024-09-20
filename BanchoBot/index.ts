import { BanchoClient } from "bancho.js";
import { config } from "node-config-ts";

import baseServer from "../Server/baseServer";
import koaBody from "koa-body";
import Mount from "koa-mount";
import gracefulShutdown from "http-graceful-shutdown";
import os from "os";

import banchoRouter from "../Server/api/routes/bancho";
import banchoRefereeRouter from "../Server/api/routes/bancho/referee";
import banchoStreamRouter from "../Server/api/routes/bancho/stream";

import ormConfig from "../ormconfig";

import messageHandler from "./handlers/messageHandler";
import state from "./state";
import { discordClient } from "../Server/discord";

// Bancho Client
const banchoClient = new BanchoClient({
    username: config.osu.bancho.username,
    password: config.osu.bancho.ircPassword,
    botAccount: config.osu.bancho.botAccount,
    apiKey: config.osu.v1.apiKey,
});
banchoClient.connect()
    .then(() => {
        console.log(`Logged into Bancho as ${banchoClient.getSelf().ircUsername}`);
        banchoClient.on("state", (connectState) => {
            console.log(`Bancho state: ${connectState.toString()}`);
        });
    })
    .catch(err => {
        console.error("Failed to connect to Bancho.", err);
        process.exit(1);
    });
banchoClient.on("PM", (msg) => {
    console.log(`[PM] ${msg.user.ircUsername} says to ${msg.recipient.ircUsername}: ${msg.content}`);
});
banchoClient.on("PM", messageHandler);

banchoClient.on("CM", messageHandler);

const koa = baseServer;

koa.use(koaBody());

// General

/// Cron
koa.use(Mount("/api/bancho", banchoRouter.routes()));

/// Referee
koa.use(Mount("/api/bancho/referee", banchoRefereeRouter.routes()));

/// Stream
koa.use(Mount("/api/bancho/stream", banchoStreamRouter.routes()));

let httpShutdown: () => Promise<void> | undefined;
ormConfig.initialize()
    .then((connection) => {
        console.log(`Connected to the ${connection.options.database} database!`);
        const server = koa.listen(config.banchoBot.port);
        httpShutdown = gracefulShutdown(server, {
            signals: "", // leave signals handling to us
        });
    })
    .catch((error) => console.log("An error has occurred in connecting.", error));

const maybeShutdown = async () => {
    if (!state.shuttingDown)
        return;

    if (state.runningMatchups > 0) {
        console.log(`Waiting for ${state.runningMatchups} matchups to finish...`);
    } else {
        console.log("No running matchup.");
        await httpShutdown?.();
        console.log("Done handling all API requests, closed HTTP server.");
        await ormConfig.destroy();
        discordClient.destroy();
        banchoClient.disconnect();
        console.log("Disconnected from every service, shutting down now.");

        process.exit();
    }
};

const onTerminationSignal = (signal: NodeJS.Signals) => {
    // HTTP server not initiated yet, simply exiting.
    if (!httpShutdown) {
        process.exit();
    }

    if (state.receivedShutdownSignal) {
        console.warn(`Received ${signal}, but already shutting down. Ignoring.`);
        return;
    }

    state.receivedShutdownSignal = true;
    // Delaying shutdown as a safety net while Kubernetes sets up routing new requests to the new instance.
    console.log(`Received shutdown signal (${signal}), initiating shutdown sequence in 10 seconds.`);

    setTimeout(async () => {
        state.shuttingDown = true;
        await maybeShutdown();
    }, 10000);
};

process.on("SIGTERM", () => onTerminationSignal("SIGTERM"));
process.on("SIGINT", () => onTerminationSignal("SIGINT"));

const ip = Object.values(os.networkInterfaces()).flatMap(i => i).find(i => i?.family === "IPv4" && !i.internal)?.address;
if (!ip) {
    console.error("Failed to find non-internal IP address. This is required for the bot to work.");
    process.exit(1);
}

const baseURL = `http://${ip}:${config.banchoBot.port}`;

export { banchoClient, maybeShutdown, baseURL };
