import { config } from "node-config-ts";
import { Message, TextChannel } from "discord.js";
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
        !member?.roles.cache.has(config.discord.roles.corsace.headStaff) &&
        !config.discord.roles.open.mapper.some(r => member?.roles.cache.has(r)) &&
        !config.discord.roles.closed.mapper.some(r => member?.roles.cache.has(r))
    ) {
        m.channel.send("You do not have the perms to use this command.");
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
            round = roundAcronyms[roundNames.findIndex(name => name === part)];
        else if (roundAcronyms.some(name => name === part))
            round = part;
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
    if (round === "") {
        m.channel.send("No round is provided.");
        return;
    }
    round = round.toUpperCase();

    // Get pool data and iterate thru
    const rows = await getPoolData(pool, round);
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.some(val => val === member?.id)) {
            if (
                (slot === "") || // no slot given
                (slot !== "" && slot.toLowerCase() === row[0].toLowerCase()) // slot given
            ) {
                await updatePoolRow(pool, `'${round}'!O${i + 2}`, [ link ]);
                m.channel.send(`Submitted your map for the slot **${row[0].toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}**\n${m.attachments.first() ? "**DO NOT DELETE YOUR MESSAGE, YOUR LINK IS THE ATTACHMENT.**" : ""}`);
                return;
            }
        }
    }
    m.channel.send(`Could not find anything for **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** which you were also assigned to.`);
}

const mappoolSubmit: Command = {
    name: ["psubmit", "poolsubmit", "submitp", "submitpool"], 
    description: "Allows an assigned mapper to send a link / attachment for their finished/work in progress beatmap\nDefaults to NM -> HD -> HR -> DT -> FM -> TB",
    usage: "!psubmit <link / attachment> <round> [slot] [pool]", 
    category: "mappool",
    command,
};

export default mappoolSubmit;