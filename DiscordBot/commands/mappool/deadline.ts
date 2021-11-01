import { Message } from "discord.js";
import { getPoolData, updatePoolRow } from "../../../Server/sheets";
import { Command } from "../index";
import mappoolFunctions from "../../functions/mappoolFunctions";

async function command (m: Message) {
    if (!(await mappoolFunctions.privilegeChecks(m, false, false)))
        return;

    const waiting = await m.channel.send("Adding deadline...");
    try {
        const { pool, slot, round, deadlineType } = await mappoolFunctions.parseParams(m);

        // check if slot and round were given
        if (slot === "") {
            m.channel.send("Missing slot");
            return;
        }
        if (round === "") {
            m.channel.send("Missing round");
            return;
        }

        // Get deadline
        const parts = m.content.toLowerCase().replace(pool, "").replace(slot, "").replace(round, "").replace(deadlineType, "").trim().split(" ");
        parts.shift();
        const deadline = new Date(parts.join(" ").trim());
        if (isNaN(deadline.getDate())) {
            m.channel.send(`**${parts.join(" ").trim()}** is an invalid date.\nPlease add the date **after** the slot`);
            return;
        }
        if (deadline.getUTCFullYear() < new Date().getUTCFullYear())
            deadline.setUTCFullYear(new Date().getUTCFullYear());

        // Get pool data and iterate thru
        const rows = await getPoolData(pool, round);
        if (!rows) {
            m.channel.send(`Could not find round **${round.toUpperCase()}** in the **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** pool`);
            return;
        }
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (slot.toLowerCase() === row[0].toLowerCase()) {
                await updatePoolRow(pool, `'${round}'!${deadlineType === "map" ? "N" : "M"}${i + 2}`, [ deadline.toDateString() ]);
                m.channel.send(`Slot **${slot.toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** now has a **${deadlineType} deadline** for ${deadline.toDateString()}\nMapper will be pinged every 12 hours for the last 3 days before deadline.`);
                return;
            }
        }
        m.channel.send(`Unable to find slot **${slot.toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**.\nPlease add the date **after** the slot`);
    } finally {
        waiting.delete();
    }
}

const mappoolDeadline: Command = {
    name: ["pdeadline", "pooldeadline", "deadlinep", "deadlinepool"], 
    description: "Let's you add a deadline for the specified slot and specified deadline slot",
    usage: "!pdeadline <round> <slot> <datetime> [pool] [deadline type]", 
    category: "mappool",
    command,
};

export default mappoolDeadline;