import { config } from "node-config-ts";
import { Message } from "discord.js";
import { getToDoData, sheetsClient } from "../../../Server/sheets";
import { Command } from "../index";

async function command (m: Message) {
    // Get prio number
    const splitMessage = m.content.split(" ");
    if (!splitMessage.some(part => /\d+/.test(part))) {
        m.channel.send("No priority number provided!");
        return;
    }
    const prio = parseInt(splitMessage.find(part => /\d+/.test(part)) as string);

    // Get rows + check if prio number given is higher than possible
    const rows = await getToDoData();
    const userRows = rows.filter(row => row[0] === m.author.id).sort((a, b) => parseInt(a[1]) - parseInt(b[1]));
    if (userRows.length < prio) {
        m.channel.send(`${prio} is higher than the amount of todos you have (${userRows.length})!`);
        return;
    }

    // Mark the todo as done/not done
    const i = rows.findIndex(row => row[0] === m.author.id && parseInt(row[1]) === prio);

    await sheetsClient.spreadsheets.values.update({
        spreadsheetId: config.google.sheets.todo,
        range: `todos!E${i + 2}`,
        valueInputOption: "RAW", 
        requestBody: {
            values: [
                [ rows[i][4] === "TRUE" ? false : true ],
            ],
        },
    });

    m.channel.send(`Marked todo: \`${rows[i][2]}\` as **${rows[i][4] === "TRUE" ? "not done" : "done"}**`);
}

const mark: Command = {
    name: ["mark"], 
    description: "Mark a todo done/not done using the priority number",
    usage: "!mark <prio number>", 
    category: "utility",
    command,
};

export default mark;