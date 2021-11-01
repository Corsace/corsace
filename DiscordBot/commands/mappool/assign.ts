import { Message } from "discord.js";
import { getPoolData, updatePoolRow } from "../../../Server/sheets";
import { Command } from "../index";
import mappoolFunctions from "../../functions/mappoolFunctions";

async function command (m: Message) {
    if (!(await mappoolFunctions.privilegeChecks(m, false, false)))
        return;

    const waiting = await m.channel.send("Assigning...");
    try {
        const { pool, user, slot, round } = await mappoolFunctions.parseParams(m);

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
            if (slot.toLowerCase() === row[0].toLowerCase()) {
                await Promise.all([
                    updatePoolRow(pool, `'${round}'!B${i + 2}`, [ user.nickname ?? user.user.username ]),
                    updatePoolRow(pool, `'${round}'!P${i + 2}`, [ user.id ]),
                ]);
                m.channel.send(`Assigned ${user.nickname ?? user.user.username} to the slot **${slot.toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**`);
                return;
            }
        }
        m.channel.send(`Could not assign ${user.nickname ?? user.user.username} to the slot **${slot.toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**`);
    } finally {
        waiting.delete();
    }
}

const mappoolAssign: Command = {
    name: ["passign", "poolassign", "assignp", "assignpool"], 
    description: "Allows mappool heads to assign mappers to slots / rounds",
    usage: "!passign [@mention | username | nickname] <pool> <round> <slot>", 
    category: "mappool",
    command,
};

export default mappoolAssign;