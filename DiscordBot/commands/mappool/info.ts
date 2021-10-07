import { config } from "node-config-ts";
import { Message, MessageEmbed, TextChannel } from "discord.js";
import { getPoolData } from "../../../Server/sheets";
import { Command } from "../index";
import identifierToPool from "../../functions/identifierToPool";
import { discordClient, getMember } from "../../../Server/discord";
import { roundAcronyms, roundNames } from "../../../Interfaces/rounds";

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
    let round = "";

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
    }

    // check if round was given
    if (round === "") {
        m.channel.send("Missing round");
        return;
    }
    round = round.toUpperCase();

    // Get pool data and iterate thru
    const rows = await getPoolData(pool, round);

    const embed = new MessageEmbed({
        author: {
            name: pool === "openMappool" ? "Corsace Open" : "Corsace Closed",
            iconURL: discordClient.user?.displayAvatarURL({format: "png", size: 2048, dynamic: true}),
        },
        description: `**${roundNames[roundAcronyms.findIndex(name => name === round.toLowerCase())].toUpperCase()} POOL**`,
        fields: [],
    });

    for (const row of rows) {
        if (row.length < 5)
            embed.fields.push({
                name: row[0],
                value: "**EMPTY SLOT**",
                inline: true,
            });
        else
            embed.fields.push({
                name: row[0],
                value: `${row[2]} - ${row[3]} [${row[4]}] mapped by ${row[1]}`,
                inline: true,
            });
    }
    m.channel.send(embed);
}

const mappoolInfo: Command = {
    name: ["pool", "pinfo", "poolinfo"], 
    description: "Let's you obtain information about the mappool",
    usage: "!pool <round> [pool]", 
    category: "mappool",
    command,
};

export default mappoolInfo;