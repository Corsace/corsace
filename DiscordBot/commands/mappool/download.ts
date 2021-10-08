import { Message } from "discord.js";
import { getPoolData } from "../../../Server/sheets";
import { Command } from "../index";
import mappoolFunctions from "../../functions/mappoolFunctions";

async function command (m: Message) {
    if (!(await mappoolFunctions.privilegeChecks(m, true, true)))
        return;

    const waiting = await m.channel.send("Obtaining download...");
    try {
        const { pool, slot, round } = await mappoolFunctions.parseParams(m);

        // check if slot and round were given
        if (slot === "") {
            m.channel.send("Missing slot");
            return;
        }
        if (round === "") {
            m.channel.send("Missing round");
            return;
        }

        // Get pool data and iterate thru
        const rows = await getPoolData(pool, round.toUpperCase());
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (slot.toLowerCase() === row[0].toLowerCase()) {
                if (!row.some(r => /http/i.test(r)))
                    m.channel.send(`Slot **${slot.toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** does not have any submission currently.`);
                else
                    m.channel.send(row.find(r => /http/i.test(r)));
                return;
            }
        }
    } finally {
        waiting.delete();
    }
}

const mappoolDownload: Command = {
    name: ["pdl", "pdownload", "pooldl", "pooldownload", "dlp", "downloadp", "dlpool", "downloadpool"], 
    description: "Let's you download the currently submitted version of the beatmap",
    usage: "!pdl <round> <slot> [pool]", 
    category: "mappool",
    command,
};

export default mappoolDownload;