import { Message } from "discord.js";
import { getPoolData, updatePoolRow } from "../../../Server/sheets";
import { Command } from "../index";
import mappoolFunctions from "../../functions/mappoolFunctions";

async function command (m: Message) {
    if (!(await mappoolFunctions.privilegeChecks(m, true, false, true)))
        return;

    const waiting = await m.channel.send("Submitting...");
    let message: Message | undefined = undefined;
    let success = false;
    try {
        const { pool, slot, round, link } = await mappoolFunctions.parseParams(m);

        if (link === "") {
            message = await m.channel.send("No link or attachment is provided");
            return;
        }
        if (round === "") {
            message = await m.channel.send("No round is provided");
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
                    await Promise.all([
                        updatePoolRow(pool, `'${round}'!M${i + 2}`, [ "" ]),
                        updatePoolRow(pool, `'${round}'!O${i + 2}`, [ link ]),
                    ]);
                    message = await m.channel.send(`Submitted your map for the slot **${row[0].toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**\n${m.attachments.first() ? "**DO NOT DELETE YOUR MESSAGE, YOUR LINK IS THE ATTACHMENT.**" : ""}`);
                    success = true;
                    return;
                }
            }
        }
        message = await m.channel.send(`Could not find the slot **${slot.toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** which you were also assigned to.`);
    } finally {
        waiting.delete();
        if (message)
            message.delete({timeout: 3000});
        if (!success)
            m.delete({timeout: 3000});
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