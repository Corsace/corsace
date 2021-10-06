import { config } from "node-config-ts";
import { Message } from "discord.js";
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
        !member?.roles.cache.has(config.discord.roles.corsace.headStaff) &&
        !config.discord.roles.open.mapper.some(r => member?.roles.cache.has(r)) &&
        !config.discord.roles.closed.mapper.some(r => member?.roles.cache.has(r))
    ) {
        m.channel.send("You do not have the perms to use this command.");
        return;
    }

    if (!m.guild || m.guild.id !== config.discord.guild) {
        m.channel.send("You can only do this in the corsace discord server. (Please do not do this in general!)");
        return;
    }

    let pool: "openMappool" | "closedMappool" = "openMappool";
    let round = "";
    let slot = "";
    let link = "";

    // Find pool + slot + round
    const msgContent = m.content.toLowerCase();
    const parts = msgContent.split(" ");
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
        else if (/http/i.test(part))
            link = part;
        else
            slot = part;
    }

    // See if there's an attachment
    if (m.attachments.first())
        link = m.attachments.first()?.url as string;

    if (link === "") {
        m.channel.send("No link or attachment is provided.");
        return;
    }

    // Get pool data and iterate thru
    const rows = await getPoolData(pool);
    let inPool = false;
    let currentPool = "";
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.some(val => val === member?.nickname ?? member?.user.username)) {
            if (
                (slot === "" && round === "") || // no slot or round given
                (round !== "" && inPool && slot === "")  || // round given, no slot given
                (round !== "" && inPool && slot !== "" && slot.toLowerCase() === row[0].toLowerCase()) || // round and slot given
                (round === "" && slot.toLowerCase() !== row[0].toLowerCase()) // no round given, slot given
            ) {
                await sheetsClient.spreadsheets.values.update({
                    spreadsheetId: config.google.sheets[pool],
                    range: `'mappool planning & assignment'!I${i + 2}`,
                    valueInputOption: "RAW", 
                    requestBody: {
                        values: [
                            [ link ],
                        ],
                    },
                });
                m.channel.send(`Submitted your map for the slot **${row[0].toUpperCase()}** in **${currentPool.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**\n${m.attachments.first() ? "**DO NOT DELETE YOUR MESSAGE, YOUR LINK IS THE ATTACHMENT.**" : ""}`);
                return;
            }
        }
    
        if (roundNames.some(name => name === row[0].toLowerCase()) || roundAcronyms.some(name => name === row[0].toLowerCase())) {
            if (inPool) {
                if (slot !== "") {
                    m.channel.send(`Could not find slot **${slot.toUpperCase()}** in **${currentPool.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** which you were also assigned to.`);
                    return;
                }
                m.channel.send(`Could not find your slot(s) in **${currentPool.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** which you were also assigned to.`);
                return;
            }
            const roundFound = roundNames.some(name => name === row[0].toLowerCase()) ? row[0].toLowerCase() : roundNames[roundAcronyms.findIndex(name => name === row[0].toLowerCase())];
            if (roundFound === round)
                inPool = true;
            currentPool = roundFound;
            continue;
        }
    }
    m.channel.send(`Could not find anything for **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** which you were also assigned to.`);
}

const mappoolSubmit: Command = {
    name: ["psubmit", "poolsubmit", "submitp", "submitpool"], 
    description: "Allows an assigned mapper to send a link / attachment for their finished/work in progress beatmap\nDefaults to lowest round",
    usage: "!psubmit <link / attachment> [round] [slot] [pool]", 
    category: "mappool",
    command,
};

export default mappoolSubmit;