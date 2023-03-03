import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { download } from "../../../../Server/utils/download";
import { fetchMappool, fetchSlot, fetchTournament, hasTournamentRoles, isSecuredChannel } from "../../../functions/tournamentFunctions";
import { Command } from "../../index";

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
        m.reply("Missing parameters. Please use `-p <pool> [-s <slot>]` or `<pool> [<]slot]`. If you do not use the `-` prefixes, the order of the parameters is important.");
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

        if (!mappoolMap.link) {
            m.reply(`**${slot}${order}** does not have a link.`);
            return;
        }
        try {
            const data = await download(mappoolMap.link);
            m.reply({ files: [data] });
        } catch (e) {
            m.reply(`Could not download **${slot}${order}**\n\`\`\`\n${e}\`\`\``);
        }
    }

    const slots = await MappoolSlot.search(mappool, "");
    const maps = slots.map(s => s.maps).flat().map(m => m.link).filter(m => m !== undefined) as string[];
    try {
        const data = await Promise.all(maps.map(m => download(m)));
        m.reply({ files: data });
    } catch (e) {
        m.reply(`Could not download **${pool}**\n\`\`\`\n${e}\`\`\``);
    }

}

const data = new SlashCommandBuilder()
    .setName("mappool_download")
    .setDescription("Download a mappool / slot.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to download.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot to download.")
            .setRequired(false))

const mappoolDownload: Command = {
    data,
    alternativeNames: [ "download_mappool", "mappool-download", "download-mappool", "mappooldownload", "downloadmappool", "downloadp", "pdownload", "pool_download", "download_pool", "pool-download", "download-pool", "pooldownload", "downloadpool", "mappool_dl", "dl_mappool", "mappool-dl", "dl-mappool", "mappooldl", "dlmappool", "dlp", "pdl", "pool_dl", "dl_pool", "pool-dl", "dl-pool", "pooldl", "dlpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolDownload;