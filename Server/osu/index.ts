import { config } from "node-config-ts";
import { Client } from "nodesu";
import { osuAPIV2 } from "./osuAPIV2";

// API v1
const osuClient = new Client(config.osu.v1.apiKey, { parseData: true });

// API v2
const osuV2Client = new osuAPIV2(config.osu.v2.clientId, config.osu.v2.clientSecret);

export { osuClient, osuV2Client };