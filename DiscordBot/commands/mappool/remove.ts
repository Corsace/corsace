import { Message } from "discord.js";
import { getPoolData, updatePoolRow } from "../../../Server/sheets";
import { Command } from "../index";
import mappoolFunctions from "../../functions/mappoolFunctions";

async function command (m: Message) {
    if (!(await mappoolFunctions.privilegeChecks(m, false, false)))
        return;

    const waiting = await m.channel.send("Removing...");
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
        if (!rows) {
            m.channel.send(`Could not find round **${round.toUpperCase()}** in the **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** pool`);
            return;
        }
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (slot === "all") {
                await updatePoolRow(pool, `'${round}'!B${i + 2}:P${i + 2}`, [ "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ]);
                continue;
            }
            if (slot.toLowerCase() === row[0].toLowerCase()) {
                await updatePoolRow(pool, `'${round}'!B${i + 2}:P${i + 2}`, [ "", "", "", "", "", "", "", "", "", "", "", "", "", "", "" ]);
                m.channel.send(`Removed the assignment on slot **${slot.toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**`);
                return;
            }
        }
        if (slot === "all")
            m.channel.send(`Removed **all** assignments in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**`);
        else
            m.channel.send(`Could not find the slot **${slot.toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**`);
    } finally {
        waiting.delete();
    }
}

const mappoolRemove: Command = {
    name: ["premove", "poolremove", "removep", "removepool"], 
    description: "Let's you remove a mapper from a slot",
    usage: "!premove <round> <slot> [pool]", 
    category: "mappool",
    command,
};

export default mappoolRemove;