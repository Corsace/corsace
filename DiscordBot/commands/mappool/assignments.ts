import { config } from "node-config-ts";
import { GuildMember, Message, MessageEmbed, TextChannel } from "discord.js";
import { getPoolData } from "../../../Server/sheets";
import { Command } from "../index";
import identifierToPool from "../../functions/identifierToPool";
import { getMember } from "../../../Server/discord";

const acronyms = {
    openMappool: ["QL", "RO32", "RO16", "QF", "SF", "F", "GF"],
    closedMappool: ["QL", "RO16", "QF", "SF", "F", "GF"],
};

async function command (m: Message) {
    if (!m.guild || m.guild.id !== config.discord.guild || !(m.channel as TextChannel).name.toLowerCase().includes("mappool")) {
        m.channel.send("You can only do this in the corsace discord server. (Please do not use this in outside of mappool/secured channels!)");
        return;
    }

    // If core corsace staff, allow them to filter by user aside for author
    const member = await getMember(m.author.id);
    if (
        !member?.roles.cache.has(config.discord.roles.corsace.corsace) &&
        !member?.roles.cache.has(config.discord.roles.corsace.headStaff) &&
        !member?.roles.cache.has(config.discord.roles.open.testplayer) &&
        !member?.roles.cache.has(config.discord.roles.closed.testplayer) &&
        !config.discord.roles.open.mapper.some(r => member?.roles.cache.has(r)) &&
        !config.discord.roles.closed.mapper.some(r => member?.roles.cache.has(r))
    ) {
        m.channel.send("You do not have the perms to use this command.");
        return;
    }

    let pool: "openMappool" | "closedMappool" = "openMappool";
    let user = member as GuildMember;

    let msgContent = m.content.toLowerCase();
    let parts = msgContent.split(" ");

    // Check for mention
    if (m.mentions.members && m.mentions.members.first()) {
        user = m.mentions.members.first() as GuildMember;
        msgContent = m.content.replace(`<@${m.mentions.users.first()?.id}>`, "").toLowerCase();
    } else {
        for (const part of parts) {
            const members = await m.guild.members.fetch({ query: part });
            const member = members.first();
            if (member) {
                user = member;
                msgContent = m.content.replace(part, "").toLowerCase();
                break;
            }
        }
    }

    // Find pool + slot + round
    parts = msgContent.split(" ");
    for (const part of parts) {
        if (part[0] === "!")
            continue;
        const translation = identifierToPool(part);
        if (translation)
            pool = translation;
    }
    
    const embed = new MessageEmbed({
        author: {
            name: user.nickname ?? user.user.username,
            iconURL: user.user.displayAvatarURL({format: "png", size: 2048, dynamic: true}),
        },
        description: `Your assignments for **${pool === "closedMappool" ? "Corsace Closed" : "Corsace Open"}**`,
        fields: [],
    });

    // Get pool data and iterate thru
    for (const round of acronyms[pool]) {
        const rows = await getPoolData(pool, round);
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
}

const mappoolAssignments: Command = {
    name: ["passigns", "passignments", "poolassigns", "poolassignments"], 
    description: "Let's you obtain information about your/someone else's assigned slots in the pool",
    usage: "!passigns [@mention | username | nickname] [pool]", 
    category: "mappool",
    command,
};

export default mappoolAssignments;