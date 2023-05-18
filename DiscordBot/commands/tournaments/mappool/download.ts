import { ChannelType, ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { download } from "../../../../Server/utils/download";
import { fetchMappool, fetchSlot, fetchTournament, hasTournamentRoles, isSecuredChannel } from "../../../functions/tournamentFunctions";
import { Command } from "../../index";
import { createPack } from "../../../functions/mappackFunctions";
import respond from "../../../functions/respond";

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
    const video = (m instanceof Message ? videoRegex.test(m.content) ?? m.content.split(" ")[3] === "-v" : m.options.getBoolean("video")) || false;
    if (!poolText) {
        await respond(m, "Missing parameters. Please use `-p <pool> [-s <slot>] [-v]` or `<pool> [slot] [-v]`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const pool = typeof poolText === "string" ? poolText : poolText[0];

    const mappool = await fetchMappool(m, tournament, pool, false, slotText ? false : true, slotText ? false : true);
    if (!mappool) 
        return;
    
    if (!mappool.isPublic) {
        if (m.channel?.type === ChannelType.DM) {
            await respond(m, "You cannot download a private mappool in DMs.")
            return;
        }

        const securedChannel = await isSecuredChannel(m, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers, TournamentChannelType.Jobboard]);
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
            await respond(m, `Invalid slot number **${order}**. Please use a valid slot number.`);
            return;
        }

        const mappoolSlot = `${mappool.abbreviation.toUpperCase()} ${slot}${order}`;

        const slotMod = await fetchSlot(m, mappool, slot, true);
        if (!slotMod) 
            return;
            
        const mappoolMap = slotMod.maps.find(m => m.order === order);
        if (!mappoolMap) {
            await respond(m, `Could not find **${mappoolSlot}**`);
            return;
        }

        if (!mappoolMap.customBeatmap && !mappoolMap.beatmap) {
            await respond(m, `**${mappoolSlot}** currently does not have a beatmap.`);
            return;
        }
        
        if (mappoolMap.customBeatmap?.link) {
            await respond(m, mappoolMap.customBeatmap.link);
            return;
        }

        let link = mappoolMap.beatmap ? `https://osu.direct/api/d/${mappoolMap.beatmap.beatmapsetID}` : undefined;

        if (!link) {
            await respond(m, `**${mappoolSlot}** currently does not have a beatmap.`);
            return;
        }
    
        try {
            const data = await download(link);
            await respond(m, undefined, undefined, undefined, [
                {
                    attachment: data,
                    name: `${mappoolSlot}.osz`,
                }
            ]);
        } catch (e) {
            await respond(m, `Could not download **${pool}**\nosu.direct may likely be down currently. Error below:\n\`\`\`\n${e}\`\`\``);
        }

        if (m instanceof Message) m.reactions.cache.get("⏳")?.remove();
        return;
    }

    if (mappool.isPublic || (mappool.mappackExpiry?.getTime() ?? -1) > Date.now()) {
        await respond(m, mappool.mappackLink!);
        return;
    }

    try {
        if (m instanceof Message) await m.react("⏳");
        const url = await createPack(m, "mappacksTemp", mappool, `${tournament.abbreviation.toUpperCase()}${tournament.year}_${mappool.abbreviation.toUpperCase()}`, video);
        if (!url)
            return;

        mappool.mappackLink = url;
        mappool.mappackExpiry = new Date(Date.now() + 60 * 60 * 24 * 1000);
    } catch (e) {
        await respond(m, `Could not download **${pool}**\nosu.direct may likely be down currently. Error below:\n\`\`\`\n${e}\`\`\``)
        return;
    }

    await mappool.save();

    await respond(m, `Here is a temporary mappack link valid for 1 day:\n${mappool.mappackLink}`);

    if (m instanceof Message) m.reactions.cache.get("⏳")?.remove();
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