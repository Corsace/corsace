import { Message, EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../index";
import { fetchMappool, fetchSlot, fetchTournament, hasTournamentRoles, isSecuredChannel } from "../../../functions/tournamentFunctions";
import { discordClient } from "../../../../Server/discord";
import { roundAcronyms, roundNames } from "../../../../Interfaces/rounds";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";

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
            if (row[0] === "" || row.length === 0)
                continue;

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
            
            if (embed.data.fields!.length === 25) {
                m.channel.send({ embeds: [embed] });
                embed.data.fields = [];
            }
        }
        if (embed.data.fields!.length > 0)
            m.channel.send({ embeds: [embed] }); 
    } finally {
        waiting.delete();
    }
}

async function run (m: Message | ChatInputCommandInteraction) {
    const tournament = await fetchTournament(m, []);
    if (!tournament)
        return;

    const allowed = await hasTournamentRoles(m, tournament, [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers]);
    if (!allowed)
        return;
    const securedChannel = await isSecuredChannel(m, tournament, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.MappoolLog, TournamentChannelType.MappoolQA, TournamentChannelType.Testplayers]);
    if (!securedChannel)
        return;

    const poolRegex = /-p (\S+)/;
    const slotRegex = /-s (\S+)/;
    const poolText = m instanceof Message ? m.content.match(poolRegex) ?? m.content.split(" ")[1] : m.options.getString("pool");
    const slotText = m instanceof Message ? m.content.match(slotRegex) ?? m.content.split(" ")[2] : m.options.getString("slot");
    if (!poolText) {
        m.reply("Missing parameters. Please use `-p <pool> [-s <slot>]` or `<pool> [<]slot]`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const pool = typeof poolText === "string" ? poolText : poolText[0];
    if (!pool) {
        m.reply("Missing parameters. Please use `-p <pool> [-s <slot>]` or `<pool> [slot]`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const mappool = await fetchMappool(m, tournament, pool);
    if (!mappool)
        return;
    
    if (slotText) {
        const slot = parseInt(typeof slotText === "string" ? slotText.substring(0, slotText.length - 1) : slotText[0].substring(0, slotText[0].length - 1));
        const order = parseInt(typeof slotText === "string" ? slotText.substring(slotText.length - 1) : slotText[0].substring(slotText[0].length - 1));
        if (!slot || isNaN(order)) {
            m.reply("Invalid slot number. Please use a valid slot number.");
            return;
        }

        const slotMod = await fetchSlot(m, mappool, slot.toString(), true);
        if (!slotMod)
            return;
        
        const mappoolMap = slotMod.maps.find(m => m.order === order);
        if (!mappoolMap) {
            m.reply(`Could not find **${slot}${order}**`);
            return;
        }
    }
}

const data = new SlashCommandBuilder()
    .setName("mappool_info")
    .setDescription("Info of a mappool / slot.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to get info for.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot to get info for.")
            .setRequired(false))

const mappoolInfo: Command = {
    data,
    alternativeNames: [ "info_mappool", "mappool-info", "info-mappool", "mappoolinfo", "infomappool", "infop", "pinfo", "pool_info", "info_pool", "pool-info", "info-pool", "poolinfo", "infopool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolInfo;