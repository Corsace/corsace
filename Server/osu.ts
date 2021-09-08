import { config } from "node-config-ts";
import { Client } from "nodesu";

const osuClient = new Client(config.osu.v1.apiKey, { parseData: true });

export { osuClient };