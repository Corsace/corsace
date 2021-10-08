import { Message } from "discord.js";
import { getPoolData, updatePoolRow } from "../../../Server/sheets";
import { Command } from "../index";
import mappoolFunctions from "../../functions/mappoolFunctions";

async function command (m: Message) {
    if (!(await mappoolFunctions.privilegeChecks(m, true, false)))
        return;

    const waiting = await m.channel.send("Submitting...");
    try {
        const { pool, slot, round, link } = await mappoolFunctions.parseParams(m);

        if (link === "") {
            m.channel.send("No link or attachment is provided.");
            return;
        }
        if (round === "") {
            m.channel.send("No round is provided.");
            return;
        }

        // Get pool data and iterate thru
        const rows = await getPoolData(pool, round.toUpperCase());
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.some(val => val === m.author.id)) {
                if (
                    (slot === "") || // no slot given
                    (slot !== "" && slot.toLowerCase() === row[0].toLowerCase()) // slot given
                ) {
                    await updatePoolRow(pool, `'${round}'!O${i + 2}`, [ link ]);
                    m.channel.send(`Submitted your map for the slot **${row[0].toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**\n${m.attachments.first() ? "**DO NOT DELETE YOUR MESSAGE, YOUR LINK IS THE ATTACHMENT.**" : ""}`);
                    return;
                }
            }
        }
        m.channel.send(`Could not find anything for **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** which you were also assigned to.`);
    } finally {
        waiting.delete();
    }
}

const mappoolSubmit: Command = {
    name: ["psubmit", "poolsubmit", "submitp", "submitpool"], 
    description: "Allows an assigned mapper to send a link / attachment for their finished/work in progress beatmap\nDefaults to NM -> HD -> HR -> DT -> FM -> TB",
    usage: "!psubmit <link / attachment> <round> [slot] [pool]", 
    category: "mappool",
    command,
};

export default mappoolSubmit;