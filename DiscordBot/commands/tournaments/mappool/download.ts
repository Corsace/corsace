import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { download } from "../../../../Server/utils/download";
import { Command } from "../../index";
import { createPack } from "../../../../Server/functions/tournaments/mappool/mappackFunctions";
import respond from "../../../functions/respond";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import { extractParameters } from "../../../functions/parameterFunctions";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import { TournamentRoleType, TournamentChannelType } from "../../../../Interfaces/tournament";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const params = await extractParameters<parameters>(m, [
        { name: "pool", paramType: "string" },
        { name: "slot", paramType: "string", postProcess: postProcessSlotOrder, optional: true },
        { name: "video", shortName: "v", paramType: "boolean", optional: true },
    ]);
    if (!params)
        return;

    const { pool, slot, order, video } = params;

    const components = await mappoolComponents(m, pool, slot ?? true, order ?? true);
    if (!components || !("mappool" in components))
        return;

    const { tournament, mappool } = components;
    
    if (!mappool.isPublic && !await securityChecks(m, true, false, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers, TournamentChannelType.Jobboard], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers]))
        return;

    if (("mappoolMap" in components)) {
        const { mappoolMap, mappoolSlot } = components;

        if (!mappoolMap.customBeatmap && !mappoolMap.beatmap) {
            await respond(m, `**${mappoolSlot}** currently doesn't have a beatmap`);
            return;
        }
        
        if (mappoolMap.customBeatmap?.link) {
            await respond(m, mappoolMap.customBeatmap.link);
            return;
        }

        const link = mappoolMap.beatmap ? `https://osu.direct/api/d/${mappoolMap.beatmap.beatmapsetID}` : undefined;
        if (!link) {
            await respond(m, `**${mappoolSlot}** currently doesn't have a beatmap`);
            return;
        }
    
        try {
            const data = download(link);
            await respond(m, undefined, undefined, undefined, [
                {
                    attachment: data,
                    name: `${mappoolSlot}.osz`,
                },
            ]);
        } catch (e) {
            await respond(m, `Can't download **${pool}**\nosu.direct is proly currently down. Error below:\n\`\`\`\n${e}\`\`\``);
        }

        return;
    }
    if (slot && order) {
        await respond(m, `**${pool} ${slot}${order}** currently doesn't have a beatmap`);
        return;
    }

    if ("slotMod" in components) {
        const { slotMod } = components;

        await respond(m, slotMod.maps.map(map => {
            const link = map.beatmap ? `https://osu.direct/api/d/${map.beatmap.beatmapsetID}` : map.customBeatmap ? map.customBeatmap.link : undefined;
            return `**${slotMod.acronym.toUpperCase()}${slotMod.maps.length === 1 ? "" : map.order}**: ${link ?? "No beatmap"}`;
        }).join("\n"));

        return;
    }

    if (mappool.isPublic || (mappool.mappackExpiry?.getTime() ?? -1) > Date.now()) {
        await respond(m, mappool.mappackLink!);
        return;
    }

    try {
        if (m instanceof Message) await m.react("⏳");
        const url = await createPack(m, "mappacksTemp", mappool, `${tournament.abbreviation.toUpperCase()}_${mappool.abbreviation.toUpperCase()}`, video);
        if (!url)
            return;

        mappool.mappackLink = url;
        mappool.mappackExpiry = new Date(Date.now() + 60 * 60 * 24 * 1000);
    } catch (e) {
        await respond(m, `Can't download **${pool}**\nosu.direct is proly currently down. Error below:\n\`\`\`\n${e}\`\`\``);
        return;
    }

    await mappool.save();

    await respond(m, `Here's a temp. mappack link valid for 1 day:\n${mappool.mappackLink}`);

    if (m instanceof Message) 
        await m.reactions.cache.get("⏳")?.remove();
}

const data = new SlashCommandBuilder()
    .setName("mappool_download")
    .setDescription("Download a mappool / slot.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to download.")
            .setRequired(false))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot to download.")
            .setRequired(false))
    .addBooleanOption(option =>
        option.setName("video")
            .setDescription("Whether to download with videos or not.")
            .setRequired(false));

interface parameters {
    pool?: string,
    slot?: string,
    order?: number,
    video?: boolean,
}

const mappoolDownload: Command = {
    data,
    alternativeNames: [ "download_mappool", "mappool-download", "download-mappool", "mappooldownload", "downloadmappool", "downloadp", "pdownload", "pool_download", "download_pool", "pool-download", "download-pool", "pooldownload", "downloadpool", "mappool_dl", "dl_mappool", "mappool-dl", "dl-mappool", "mappooldl", "dlmappool", "dlp", "pdl", "pool_dl", "dl_pool", "pool-dl", "dl-pool", "pooldl", "dlpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolDownload;