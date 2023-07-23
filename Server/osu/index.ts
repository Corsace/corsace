import { config } from "node-config-ts";
import { Client } from "nodesu";
import { osuAPIV2 } from "./osuAPIV2";

// API v1
const osuClient = new Client(config.osu.v1.apiKey, { parseData: true, baseUrl: config.osu.v1.baseUrl });

// API v2
const osuV2Client = new osuAPIV2(config.osu.v2.clientId, config.osu.v2.clientSecret, { baseURL: config.osu.v2.baseUrl });

export { osuClient, osuV2Client };