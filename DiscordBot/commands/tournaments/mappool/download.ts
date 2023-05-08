import { ChannelType, ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { download } from "../../../../Server/utils/download";
import { zipFiles } from "../../../../Server/utils/zip";
import { fetchMappool, fetchSlot, fetchTournament, hasTournamentRoles, isSecuredChannel } from "../../../functions/tournamentFunctions";
import { Command } from "../../index";
import { buckets } from "../../../../Server/s3";
import { randomUUID } from "crypto";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const tournament = await fetchTournament(m);
    if (!tournament) 
        return;

    const poolRegex = /-p (\S+)/;
    const slotRegex = /-s (\S+)/;
    const videoRegex = /-v/;
    const poolText = m instanceof Message ? m.content.match(poolRegex) ?? m.content.split(" ")[1] : m.options.getString("pool");
    const slotText = m instanceof Message ? m.content.match(slotRegex) ?? m.content.split(" ")[2] : m.options.getString("slot");
    const video = m instanceof Message ? m.content.match(videoRegex) ?? m.content.split(" ")[3] : m.options.getBoolean("video");
    if (!poolText) {
        if (m instanceof Message) m.reply("Missing parameters. Please use `-p <pool> [-s <slot>]` or `<pool> [<]slot]`. If you do not use the `-` prefixes, the order of the parameters is important.");
        else m.editReply("Missing parameters. Please use `-p <pool> [-s <slot>]` or `<pool> [<]slot]`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const pool = typeof poolText === "string" ? poolText : poolText[0];

    const mappool = await fetchMappool(m, tournament, pool);
    if (!mappool) 
        return;
    
    if (!mappool.isPublic) {
        if (m.channel?.type === ChannelType.DM) {
            if (m instanceof Message) m.reply("You cannot download a private mappool in DMs.");
            else m.editReply("You cannot download a private mappool in DMs.");
            return;
        }

        const securedChannel = await isSecuredChannel(m, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers]);
        if (!securedChannel) 
            return;

        const allowed = await hasTournamentRoles(m, tournament, [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers]);
        if (!allowed) 
            return;
    }

    if (slotText) {
        const slot = (typeof slotText === "string" ? slotText.substring(0, slotText.length - 1) : slotText[1].substring(0, slotText[1].length - 1)).toUpperCase();
        const order = parseInt(typeof slotText === "string" ? slotText.substring(slotText.length - 1) : slotText[1].substring(slotText[1].length - 1));

        if (isNaN(order)) {
            if (m instanceof Message) m.reply("Invalid slot number. Please use a valid slot number.");
            else m.editReply("Invalid slot number. Please use a valid slot number.");
            return;
        }
        const mappoolSlot = `${mappool.abbreviation.toUpperCase()} ${slot}${order}`;

        const slotMod = await fetchSlot(m, mappool, slot, true);
        if (!slotMod) 
            return;
            
        const mappoolMap = slotMod.maps.find(m => m.order === order);
        if (!mappoolMap) {
            if (m instanceof Message) m.reply(`Could not find **${mappoolSlot}**`);
            else m.editReply(`Could not find **${mappoolSlot}**`);
            return;
        }

        if (!mappoolMap.customBeatmap && !mappoolMap.beatmap) {
            if (m instanceof Message) m.reply(`**${mappoolSlot}** does not have a link.`);
            else m.editReply(`**${mappoolSlot}** does not have a link.`);
            return;
        }

        let link = mappoolMap.customBeatmap ? mappoolMap.customBeatmap.link : mappoolMap.beatmap ? `https://osu.direct/api/d/${mappoolMap.beatmap.beatmapsetID}` : undefined;

        if (!link) {
            if (m instanceof Message) m.reply(`**${mappoolSlot}** currently does not have a beatmap.`);
            else m.editReply(`**${mappoolSlot}** currently does not have a beatmap.`);
            return;
        }
    
        try {
            const data = await download(link);
            if (m instanceof Message) m.reply({ files: [
                {
                    attachment: data,
                    name: `${mappoolSlot}.osz`,
                }
            ] });
            else m.editReply({ files: [
                {
                    attachment: data,
                    name: `${mappoolSlot}.osz`,
                }
            ] });
        } catch (e) {
            if (m instanceof Message) m.reply(`Could not download **${mappoolSlot}**\n\`\`\`\n${e}\`\`\``);
            else m.editReply(`Could not download **${mappoolSlot}**\n\`\`\`\n${e}\`\`\``);
        }
        return;
    }

    const slots = await MappoolSlot.search(mappool, "", true);
    const mappoolMaps = slots.flatMap(s => s.maps.map(m => ({ ...m, slot: s })));
    const filteredMaps = mappoolMaps.filter(m => m !== undefined && ((m.customBeatmap && m.customBeatmap.link) || m.beatmap));
    const names = filteredMaps.map(m => `${m.slot.acronym}${m.order}.osz`);
    const dlLinks = filteredMaps.map(m => m.customBeatmap ? m.customBeatmap.link! : `https://osu.direct/api/d/${m.beatmap!.beatmapsetID}${video ? "" : "n"}`);

    if (filteredMaps.length === 0) {
        if (m instanceof Message) m.reply(`**${pool}** does not have any downloadable beatmaps.`);
        else m.editReply(`**${pool}** does not have any downloadable beatmaps.`);
        return;
    }

    try {
        const streams = dlLinks.map(m => download(m));
        const zipStream = zipFiles(streams.map((d, i) => ({ content: d, name: names[i] })));

        const s3Key = `${randomUUID()}/${tournament.abbreviation.toUpperCase()}${tournament.year} ${mappool.abbreviation.toUpperCase()}.zip`;
        await buckets.mappacksTemp.putObject(s3Key, zipStream, "application/zip");
        const url = await buckets.mappacksTemp.getSignedUrl(s3Key, 60 * 60 * 24 * 7);

        // TODO: Rewrite to send generated URL instead of attaching.

        // if (m instanceof Message) await m.reply({ files: [
        //     {
        //         attachment: zipStream,
        //         name,
        //     }
        // ] });
        // else await m.editReply({ files: [
        //     {
        //         attachment: zipStream,
        //         name,
        //     }
        // ] });
    } catch (e) {
        if (m instanceof Message) m.reply(`Could not download **${pool}**\nosu.direct may likely be down currently.\n\`\`\`\n${e}\`\`\``);
        else m.editReply(`Could not download **${pool}**\nosu.direct may likely be down currently.\n\`\`\`\n${e}\`\`\``);
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
    .addBooleanOption(option =>
        option.setName("video")
            .setDescription("Whether to download with videos or not.")
            .setRequired(false));

const mappoolDownload: Command = {
    data,
    alternativeNames: [ "download_mappool", "mappool-download", "download-mappool", "mappooldownload", "downloadmappool", "downloadp", "pdownload", "pool_download", "download_pool", "pool-download", "download-pool", "pooldownload", "downloadpool", "mappool_dl", "dl_mappool", "mappool-dl", "dl-mappool", "mappooldl", "dlmappool", "dlp", "pdl", "pool_dl", "dl_pool", "pool-dl", "dl-pool", "pooldl", "dlpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolDownload;