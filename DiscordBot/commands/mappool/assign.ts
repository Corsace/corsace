import { config } from "node-config-ts";
import { GuildMember, Message, TextChannel } from "discord.js";
import { getPoolData, updatePoolRow } from "../../../Server/sheets";
import { Command } from "../index";
import identifierToPool from "../../functions/identifierToPool";
import { getMember } from "../../../Server/discord";
import { roundAcronyms, roundNames } from "../../../Interfaces/rounds";

async function command (m: Message) {
    if (!m.guild || m.guild.id !== config.discord.guild || (!(m.channel as TextChannel).name.toLowerCase().includes("mappool") && !(m.channel as TextChannel).name.toLowerCase().includes("head"))) {
        m.channel.send("You can only do this in the corsace discord server. (Please do not use this in outside of mappool/secured channels!)");
        return;
    }

    // If core corsace staff, allow them to filter by user aside for author
    const member = await getMember(m.author.id);
    if (
        !member?.roles.cache.has(config.discord.roles.corsace.corsace) &&
        !member?.roles.cache.has(config.discord.roles.corsace.headStaff)
    ) {
        m.channel.send("You do not have the perms to use this command.");
        return;
    }

    let pool: "openMappool" | "closedMappool" = "openMappool";
    let user = member;
    let round = "";
    let slot = "";

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
        else if (roundNames.some(name => name === part))
            round = roundAcronyms[roundNames.findIndex(name => name === part)];
        else if (roundAcronyms.some(name => name === part))
            round = part;
        else
            slot = part;
    }

    // check if slot and round were given
    if (slot === "") {
        m.channel.send("Missing slot");
        return;
    }
    if (round === "") {
        m.channel.send("Missing round");
        return;
    }
    round = round.toUpperCase();

    // Get pool data and iterate thru
    const rows = await getPoolData(pool, round);
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
}

const mappoolAssign: Command = {
    name: ["passign", "poolassign", "assignp", "assignpool"], 
    description: "Allows mappool heads to assign mappers to slots / rounds",
    usage: "!passign [@mention | username | nickname] <pool> <round> <slot>", 
    category: "mappool",
    command,
};

export default mappoolAssign;