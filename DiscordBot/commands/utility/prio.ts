import { config } from "node-config-ts";
import { Message, MessageEmbed } from "discord.js";
import { getToDoData, sheetsClient } from "../../../Server/sheets";
import { Command } from "../index";

async function command (m: Message) {
    const prios = m.content.split(" ");
    prios.shift();

    // Get order of numbers of prios given
    const prioNums: number[] = [];
    for (const prio of prios) {
        if (!/\d+/.test(prio))
            continue;
        if (prioNums.some(num => num === parseInt(prio))) {
            m.channel.send(`${prio} is duplicated in your order of prios`);
            return;
        }
        prioNums.push(parseInt(prio));
    }

    // Check if any are higher than possible
    const rows = await getToDoData();
    const userRows = rows.filter(row => row[0] === m.author.id).sort((a, b) => parseInt(a[1]) - parseInt(b[1]));
    if (prioNums.some(num => userRows.length < num)) {
        m.channel.send(`${prioNums.find(num => userRows.length < num)} is higher than the amount of todos you have (${userRows.length})!`);
        return;
    }

    // Add any prios not given afterwards
    for (const row of userRows)
        if (!prioNums.some(prio => prio === parseInt(row[1])))
            prioNums.push(parseInt(row[1]));
    
    // Update prio order + create embed
    const embed = new MessageEmbed({
        author: {
            name: m.author.username,
            iconURL: m.author.displayAvatarURL({format: "png", size: 2048, dynamic: true}),
        },
        description: "✅ = done\n❌ = not done",
        fields: [],
    });
    for (let i = 0; i < prioNums.length; i++) {
        const newPrio = i + 1;

        const j = rows.findIndex(row => row[0] === m.author.id && parseInt(row[1]) === prioNums[i]);

        await sheetsClient.spreadsheets.values.update({
            spreadsheetId: config.google.sheets.todo,
            range: `todos!B${j + 2}`,
            valueInputOption: "RAW", 
            requestBody: {
                values: [
                    [ newPrio ],
                ],
            },
        });

        embed.fields.push({
            name: `#${newPrio}`,
            value: `${rows[j][2]} ${rows[j][4] === "FALSE" ? "**❌**" : "**✅**"}`,
            inline: true,
        });
    }

    m.channel.send(embed);
}

const prio: Command = {
    name: ["prio"], 
    description: "Change the order of priorities for your priorities",
    usage: "!prio <prio 1> <prio 2> [prio 3] ...",
    category: "utility",
    command,
};

export default prio;