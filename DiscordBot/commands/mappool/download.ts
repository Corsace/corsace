import { Message } from "discord.js";
import { getPoolData } from "../../../Server/sheets";
import { Command } from "../index";
import mappoolFunctions from "../../functions/mappoolFunctions";

async function command (m: Message) {
    if (!(await mappoolFunctions.privilegeChecks(m, true, true)))
        return;
    
    const { pool, slot, round } = await mappoolFunctions.parseParams(m);

    // check if round was given
    if (round === "") {
        m.channel.send("Missing round");
        return;
    }

    const waiting = await m.channel.send(`Obtaining ${slot !== "" ? "download" : "links"}...`);
    try {

        // Get pool data and iterate thru
        const rows = await getPoolData(pool, round.toUpperCase());
        if (!rows) {
            m.channel.send(`Could not find round **${round.toUpperCase()}** in the **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** pool`);
            return;
        }
        if (slot !== "")
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
        else {
            let links = "";
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                links += `**${row[0].toUpperCase()}:** ${row.find(r => /http/i.test(r)) ?? ""}\n`;
            }
            m.channel.send(links);
            return;
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