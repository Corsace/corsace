import { config } from "node-config-ts";
import { TextChannel } from "discord.js";
import { discordClient } from "../../Server/discord";
import { getPoolData } from "../../Server/sheets";

const acronyms = {
    openMappool: ["QL", "RO32", "RO16", "QF", "SF", "F", "GF"],
    closedMappool: ["QL", "RO16", "QF", "SF", "F", "GF"],
};
const pools: ("openMappool" | "closedMappool")[] = ["openMappool", "closedMappool"];

const hours12 = 43200000;
const days3 = 259200000;

async function pingChannel (pool: "openMappool" | "closedMappool") {
    if (pool === "openMappool")
        return (await discordClient.channels.fetch(config.discord.mappoolChannelCO, false, true)) as TextChannel;
    if (pool === "closedMappool")
        return (await discordClient.channels.fetch(config.discord.mappoolChannelCC, false, true)) as TextChannel;
}

async function checkTimers () {
    for (const pool of pools) {
        const channel = (await pingChannel(pool)) as TextChannel;
        for (const round of acronyms[pool]) {
            const rows = await getPoolData(pool, round);
            for (const row of rows) {
                if (row.length < 16)
                    continue;
                try {
                    const user = await discordClient.users.fetch(row[15]);
                    const now = new Date;
                    if (row[12] !== "") {
                        const prevDeadline = new Date(row[12]);
                        if (prevDeadline.getTime() - now.getTime() < days3 && prevDeadline.getTime() > now.getTime())
                            channel.send(`${user.toString()} You have **less than 3 days** to submit your preview for **${round} ${row[0]} (${row[12]})**`);
                    }
                    if (row[13] !== "") {
                        const mapDeadline = new Date(row[13]);
                        if (mapDeadline.getTime() - now.getTime() < days3 && mapDeadline.getTime() > now.getTime())
                            channel.send(`${user.toString()} You have **less than 3 days** to submit your completed beatmap for **${round} ${row[0]} (${row[13]})**`);
                    }
                } catch (e) {
                    if (e) {
                        console.error(e);
                        const log = (await discordClient.channels.fetch(config.discord.logChannel)) as TextChannel;
                        log.send("COULD NOT SEND MESSAGE:\n```\n" + (e as Error).toString() + "\n```");
                    }
                }
            }
        }
    }
}

async function sheetTimer () {
    await checkTimers();
    setInterval(checkTimers, hours12);
}

export default {
    acronyms,
    pools,
    sheetTimer,
};