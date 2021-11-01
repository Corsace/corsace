import { Message, MessageEmbed } from "discord.js";
import { getPoolData } from "../../../Server/sheets";
import { Command } from "../index";
import sheetFunctions from "../../functions/mappoolFunctions";
import mappoolFunctions from "../../functions/mappoolFunctions";

async function command (m: Message) {
    if (!(await mappoolFunctions.privilegeChecks(m, true, true)))
        return;

    const waiting = await m.channel.send("Obtaining assignments...");
    try {
        const { pool, user } = await mappoolFunctions.parseParams(m);
        
        const embed = new MessageEmbed({
            author: {
                name: user.nickname ?? user.user.username,
                iconURL: user.user.displayAvatarURL({format: "png", size: 2048, dynamic: true}),
            },
            description: `${m.author.id === user.id ? "Your" : user.nickname ?? user.user.username} assignments for **${pool === "closedMappool" ? "Corsace Closed" : "Corsace Open"}**`,
            fields: [],
        });

        // Get pool data and iterate thru
        for (const round of sheetFunctions.acronyms[pool]) {
            const rows = await getPoolData(pool, round);
            if (!rows)
                continue;
            for (const row of rows) {
                if (row.some(v => v === user?.id))
                    embed.fields.push({
                        name: `${round} ${row[0]}: ${row[2]} - ${row[3]} [${row[4]}]`,
                        value: `Preview Deadline: ${row[12]}\nMapping deadline: ${row[13]}`,
                        inline: true,
                    });
            }
        }
        m.channel.send(embed);
    } finally {
        waiting.delete();
    }
}

const mappoolAssignments: Command = {
    name: ["passigns", "passignments", "poolassigns", "poolassignments"], 
    description: "Let's you obtain information about your/someone else's assigned slots in the pool",
    usage: "!passigns [@mention | username | nickname] [pool]", 
    category: "mappool",
    command,
};

export default mappoolAssignments;