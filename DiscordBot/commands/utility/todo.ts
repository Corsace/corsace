import { config } from "node-config-ts";
import { Message, User } from "discord.js";
import { getToDoData, sheetsClient } from "../../../Server/sheets";
import { Command } from "../index";
import { discordClient, discordGuild, getMember } from "../../../Server/discord";

async function command (m: Message) {
    let target = m.author;
    let msgContent = m.content.toLowerCase().trim();

    // See if head staff to see if the target should be someone other than the author
    const member = await getMember(m.author.id);
    if (
        (
            member?.roles.cache.has(config.discord.roles.corsace.corsace) ||
            member?.roles.cache.has(config.discord.roles.corsace.core)
        ) && 
        msgContent.includes("-other")
    ) {
        if (m.mentions.users.first())
            target = m.mentions.users.first() as User;
        else {
            const targetString = msgContent.split(" ")[1];
            try {
                const user = await discordClient.users.fetch(targetString);
                target = user;
            } catch (e) {
                const members = await (await discordGuild()).members.fetch({ query: targetString });
                const user = members.first()?.user;
                if (!user) {
                    m.channel.send(`Could not find the user ${targetString}`);
                    return;
                }
                target = user;
            }
            msgContent = msgContent.replace(targetString, "");
        }
    }

    msgContent = msgContent.replace("!todo", "").replace("-other", "").trim();
    const rows = await getToDoData();
    const prio = parseInt(rows.filter(row => row[0] === target.id).length > 0 ? rows.filter(row => row[0] === target.id).reduce((p, c) => parseInt(p[1]) > parseInt(c[1]) ? p : c)[1] : "0") + 1;
    const row = rows.filter(row => /\d+/.test(row[0])).length + 2;

    await sheetsClient.spreadsheets.values.update({
        spreadsheetId: config.google.sheets.todo,
        range: `todos!A${row}:D${row}`,
        valueInputOption: "RAW", 
        requestBody: {
            values: [
                [target.id, prio, msgContent, new Date().toLocaleString("en-GB")],
            ],
        },
    });

    m.channel.send(`Added todo: \`${msgContent}\` as priority #${prio} for ${target.id === m.author.id ? "you" : `**${target.username}**`}`);
}

const todo: Command = {
    name: ["todo"], 
    description: "Add something in the todo list",
    usage: "!todo", 
    category: "utility",
    command,
};

export default todo;