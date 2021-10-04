import { config } from "node-config-ts";
import { Message, MessageEmbed, User } from "discord.js";
import { getToDoData } from "../../../Server/sheets";
import { Command } from "../index";
import { discordClient, discordGuild, getMember } from "../../../Server/discord";

async function command (m: Message) {
    // Initialize vars
    let target = m.author;
    let filter: "default" | "all" | "done" = "default";
    let allUsers = false;
    let rows = await getToDoData();

    // Check for -all or -done filter tags 
    let msgContent = m.content.toLowerCase();
    if (msgContent.includes("-all"))
        filter = "all";
    else if (msgContent.includes("-done"))
        filter = "done";

    msgContent = msgContent.replace(/(-all|-done)/g, "").trim();

    // If core corsace staff, allow them to filter by user aside for author
    const member = await getMember(m.author.id);
    if (
        (
            member?.roles.cache.has(config.discord.roles.corsace.corsace) ||
            member?.roles.cache.has(config.discord.roles.corsace.core)
        ) && 
        msgContent.split(" ").length > 1
    ) {
        // For getting all users
        if (msgContent.includes("-full"))
            allUsers = true;
        else { 
            // Evil if else staircase incoming
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
            }
        }
    }

    // Filter the rows with the filter type
    rows = rows.filter(row => {
        if (filter === "all")
            return true;
        if (filter === "default")
            return row[4] === "FALSE";
        if (filter === "done")
            return row[4] === "TRUE";
    });

    // Filter by user
    if (!allUsers) 
        rows = rows.filter(row => row[0] === target.id);
    rows = rows.filter(row => /\d+/g.test(row[0])).sort((a, b) => parseInt(a[1]) - parseInt(b[1]));

    if (rows.length === 0) {
        m.channel.send(`No ${filter === "all" ? " " : filter === "default" ? "unfinished " : "finished " } tasks in the todo list currently`);
        return;
    }

    // Create embed
    const embed = new MessageEmbed({
        author: {
            name: m.author.username,
            iconURL: m.author.displayAvatarURL({format: "png", size: 2048, dynamic: true}),
        },
        fields: [],
    });
    if (target.id !== m.author.id)
        embed.author = {
            name: target.username,
            iconURL: target.displayAvatarURL({format: "png", size: 2048, dynamic: true}),
        };
    if (filter === "all")
        embed.description = "✅ = done\n❌ = not done";
    else if (filter === "default")
        embed.description = "All not done ❌";
    else if (filter === "done")
        embed.description = "All done ✅";

    // Add fields to embed
    const users = {};
    for (const row of rows) {
        if (allUsers) {
            if (!users[row[0]]) {
                try {
                    const apiUser = await discordClient.users.fetch(row[0]);
                    users[row[0]] = `${apiUser.username}#${apiUser.discriminator}`;
                } catch (e) {
                    users[row[0]] = row[0];
                }
            }
            embed.fields.push({
                name: `${users[row[0]]} (#${row[1]})`,
                value: `${row[2]} ${filter === "all" ? row[4] === "FALSE" ? "**❌**" : "**✅**" : ""}`,
                inline: true,
            });
            continue;
        }

        embed.fields.push({
            name: `#${row[1]}`,
            value: `${row[2]} ${filter === "all" ? row[4] === "FALSE" ? "**❌**" : "**✅**" : ""}`,
            inline: true,
        });
    }
    m.channel.send(embed);
}

const todoList: Command = {
    name: ["todolist"], 
    description: "List the unfinished todos for yourself, or see all/done only todos as well!",
    usage: "!todolist [-all|-done]", 
    category: "utility",
    command,
};

export default todoList;