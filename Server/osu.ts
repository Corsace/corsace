import { config } from "node-config-ts";
import { Client } from "nodesu";
import { osuAPIV2 } from "../Interfaces/osuAPIV2";
import { BanchoClient } from "bancho.js";

// API v1
const osuClient = new Client(config.osu.v1.apiKey, { parseData: true });

// API v2
const osuV2Client = new osuAPIV2(config.osu.v2.clientId, config.osu.v2.clientSecret);

// Bancho Client
const banchoClient = new BanchoClient({ username: config.osu.bancho.username, password: config.osu.bancho.ircPassword, botAccount: config.osu.bancho.botAccount, apiKey: config.osu.v1.apiKey });
banchoClient.connect().catch(err => {
    if (err) throw err;
});

banchoClient.on("connected", () => {
    console.log(`Logged into osu! as ${banchoClient.getSelf().ircUsername}`);
});

export { osuClient, osuV2Client, banchoClient };