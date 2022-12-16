import { Message, EmbedBuilder } from "discord.js";
import { getPoolData } from "../../../../Server/sheets";
import { Command } from "../../index";
import { discordClient } from "../../../../Server/discord";
import { roundAcronyms, roundNames } from "../../../../Interfaces/rounds";
import mappoolFunctions from "../../../functions/mappoolFunctions";

async function command (m: Message) {
    if (!(await mappoolFunctions.privilegeChecks(m, true, true)))
        return;

    const waiting = await m.channel.send("Obtaining information...");
    try {
        const { pool, round } = await mappoolFunctions.parseParams(m);

        // check if round was given
        if (round === "") {
            m.channel.send("Missing round");
            return;
        }

        // Get pool data and iterate thru
        const rows = await getPoolData(pool, round.toUpperCase());
        if (!rows) {
            m.channel.send(`Could not find round **${round.toUpperCase()}** in the **${pool === "openMappool" ? "Corsace Open" : "Corsace Closed"}** pool`);
            return;
        }

        const embed = new EmbedBuilder({
            author: {
                name: pool === "openMappool" ? "Corsace Open" : "Corsace Closed",
                iconURL: discordClient.user?.displayAvatarURL({extension: "png", size: 2048}),
            },
            description: `**${roundNames[roundAcronyms.findIndex(name => name === round.toLowerCase())].toUpperCase()} POOL**`,
            fields: [],
        });

        for (const row of rows) {
            if (row.length < 5)
                embed.addFields({
                    name: row[0],
                    value: "**EMPTY SLOT**",
                    inline: true,
                });
            else
                embed.addFields({
                    name: row[0],
                    value: `${row[2]} - ${row[3]} [${row[4]}] mapped by ${row[1]}`,
                    inline: true,
                });
        }
        m.channel.send({ embeds: [embed] });
    } finally {
        waiting.delete();
    }
}

const mappoolInfo: Command = {
    name: ["pool", "pinfo", "poolinfo"], 
    description: "Let's you obtain information about the mappool",
    usage: "!pool <round> [pool]", 
    category: "mappool",
    command,
};

export default mappoolInfo;