import { BanchoClient } from "bancho.js";
import { config } from "node-config-ts";
import { handleCommand } from "./commands";

import baseServer from "../Server/baseServer";
import koaBody from "koa-body";
import Mount from "koa-mount";

import banchoRouter from "../Server/api/routes/bancho";

import ormConfig from "../ormconfig";

// Bancho Client
const banchoClient = new BanchoClient({ username: config.osu.bancho.username, password: config.osu.bancho.ircPassword, botAccount: config.osu.bancho.botAccount, apiKey: config.osu.v1.apiKey });
banchoClient.connect().catch(err => {
    if (err) throw err;
});

banchoClient.on("connected", () => {
    console.log(`Logged into osu! as ${banchoClient.getSelf().ircUsername}`);
});

banchoClient.on("PM", async (message) => {
    // ignore messages from our own user
    if (message.self)
        return;

    // all commands will be prefixed with !
    if (message.message.startsWith("!")) {
        const commandName = message.message.substring(1);
        const args = message.message.split(" ");

        // remove !command from args
        args.shift();

        await handleCommand(commandName, message, ...args);
    }
});

const koa = baseServer;

koa.use(koaBody());

// General

/// Cron
koa.use(Mount("/api/bancho", banchoRouter.routes()));

ormConfig.initialize()
    .then(async (connection) => {
        console.log(`Connected to the ${connection.options.database} database!`);
        koa.listen(config.banchoBot.port);
    })
    .catch((error) => console.log("An error has occurred in connecting.", error));

export { banchoClient };