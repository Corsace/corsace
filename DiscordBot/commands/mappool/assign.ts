import { config } from "node-config-ts";
import { GuildMember, Message } from "discord.js";
import { getPoolData, sheetsClient } from "../../../Server/sheets";
import { Command } from "../index";
import identifierToPool from "../../functions/identifierToPool";
import { getMember } from "../../../Server/discord";
import { roundAcronyms, roundNames } from "../../../Interfaces/rounds";

async function command (m: Message) {
    // If core corsace staff, allow them to filter by user aside for author
    const member = await getMember(m.author.id);
    if (
        !member?.roles.cache.has(config.discord.roles.corsace.corsace) &&
        !member?.roles.cache.has(config.discord.roles.corsace.headStaff)
    ) {
        m.channel.send("You do not have the perms to use this command.");
        return;
    }

    if (!m.guild || m.guild.id !== config.discord.guild) {
        m.channel.send("You can only do this in the corsace discord server. (Please do not do this in general!)");
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
            round = part;
        else if (roundAcronyms.some(name => name === part))
            round = roundNames[roundAcronyms.findIndex(name => name === part)];
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

    // Get pool data and iterate thru
    const rows = await getPoolData(pool);
    let inPool = false;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (roundNames.some(name => name === row[0].toLowerCase()) || roundAcronyms.some(name => name === row[0].toLowerCase())) {
            if (inPool) {
                m.channel.send(`Could not find slot **${slot.toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**`);
                return;
            }
            const roundFound = roundNames.some(name => name === row[0].toLowerCase()) ? row[0].toLowerCase() : roundNames[roundAcronyms.findIndex(name => name === row[0].toLowerCase())];
            if (roundFound === round)
                inPool = true;
            continue;
        }

        if (inPool && slot.toLowerCase() === row[0].toLowerCase()) {
            await sheetsClient.spreadsheets.values.update({
                spreadsheetId: config.google.sheets[pool],
                range: `'mappool planning & assignment'!L${i + 2}`,
                valueInputOption: "RAW", 
                requestBody: {
                    values: [
                        [user.nickname ?? user.user.username],
                    ],
                },
            });
            m.channel.send(`Assigned ${user.nickname ?? user.user.username} to the slot **${slot.toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**`);
            return;
        }
    }
}

const mappoolAssign: Command = {
    name: ["passign", "poolassign", "assignp", "assignpool"], 
    description: "Allows mappool heads to assign mappers to slots / rounds",
    usage: "!passign @mention <pool> <round> <slot>", 
    category: "mappool",
    command,
};

export default mappoolAssign;