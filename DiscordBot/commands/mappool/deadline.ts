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
        !member?.roles.cache.has(config.discord.roles.corsace.headStaff)
    ) {
        m.channel.send("You do not have the perms to use this command.");
        return;
    }

    let pool: "openMappool" | "closedMappool" = "openMappool";
    let round = "";
    let slot = "";
    let deadlineType: "preview" | "map" = "map";
    let deadline = new Date();

    // Find pool + slot + round
    const msgContent = m.content.toLowerCase();
    let parts = msgContent.split(" ");
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
        else if (part === "preview" || part === "map")
            deadlineType = part;
        else if (round !== "" && slot === "")
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

    // Get deadline
    parts = msgContent.replace(pool, "").replace(slot, "").replace(round, "").replace(deadlineType, "").trim().split(" ");
    parts.shift();
    deadline = new Date(parts.join(" ").trim());
    if (isNaN(deadline.getDate())) {
        m.channel.send(`**${parts.join(" ").trim()}** is an invalid date.`);
        return;
    }
    if (deadline.getUTCFullYear() < new Date().getUTCFullYear())
        deadline.setUTCFullYear(new Date().getUTCFullYear());

    // Get pool data and iterate thru
    const rows = await getPoolData(pool, round);
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (slot.toLowerCase() === row[0].toLowerCase()) {
            await updatePoolRow(pool, `'${round}'!${deadlineType === "map" ? "N" : "M"}${i + 2}`, [ deadline.toDateString() ]);
            m.channel.send(`Slot **${slot.toUpperCase()}** in **${round.toUpperCase()}** on **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** now has a **${deadlineType} deadline** for ${deadline.toDateString()}\nMapper will be pinged every 12 hours for the last 3 days before deadline.`);
            return;
        }
    }
}

const mappoolDeadline: Command = {
    name: ["pdeadline", "pooldeadline", "deadlinep", "deadlinepool"], 
    description: "Let's you add a deadline for the specified slot and specified deadline slot",
    usage: "!pdeadline <round> <slot> <datetime> [pool] [deadline type]", 
    category: "mappool",
    command,
};

export default mappoolDeadline;