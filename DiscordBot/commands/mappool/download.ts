import { config } from "node-config-ts";
import { Message, TextChannel } from "discord.js";
import { getPoolData } from "../../../Server/sheets";
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
        !member?.roles.cache.has(config.discord.roles.open.testplayer) &&
        !member?.roles.cache.has(config.discord.roles.closed.testplayer) &&
        !config.discord.roles.open.mapper.some(r => member?.roles.cache.has(r)) &&
        !config.discord.roles.closed.mapper.some(r => member?.roles.cache.has(r))
    ) {
        m.channel.send("You do not have the perms to use this command.");
        return;
    }

    let pool: "openMappool" | "closedMappool" = "openMappool";
    let round = "";
    let slot = "";

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
            if (!row.some(r => /http/i.test(r)))
                m.channel.send(`Slot **${slot.toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** does not have any submission currently.`);
            else
                m.channel.send(row.find(r => /http/i.test(r)));
            return;
        }
    }
}

const mappoolDownload: Command = {
    name: ["pdl", "pdownload", "pooldl", "pooldownload", "dlp", "downloadp", "dlpool", "downloadpool"], 
    description: "Let's you download the currently submitted version of the beatmap",
    usage: "!pdl <round> <slot> [pool]", 
    category: "mappool",
    command,
};

export default mappoolDownload;