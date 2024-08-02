import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../index";
import { loginResponse } from "../../../../functions/loginResponse";
import { securityChecks } from "../../../../functions/tournamentFunctions/securityChecks";
import { extractParameters } from "../../../../functions/parameterFunctions";
import { postProcessSlotOrder } from "../../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import respond from "../../../../functions/respond";
import getUser from "../../../../../Server/functions/get/getUser";
import commandUser from "../../../../functions/commandUser";
import mappoolComponents from "../../../../functions/tournamentFunctions/mappoolComponents";
import { TournamentRoleType, TournamentChannelType } from "../../../../../Interfaces/tournament";
import { MappoolReplay } from "../../../../../Models/tournaments/mappools/mappoolReplay";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, false, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers, TournamentChannelType.Jobboard], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers]))
        return;

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const params = await extractParameters<parameters>(m, [
        { name: "pool", paramType: "string" },
        { name: "slot", paramType: "string", postProcess: postProcessSlotOrder, optional: true },
    ]);
    if (!params)
        return;

    const { pool, slot, order } = params;

    const components = await mappoolComponents(m, pool, slot ?? true, order ?? true);
    if (!components || !("mappool" in components))
        return;

    const { mappool } = components;

    if ("mappoolMap" in components) {
        const { mappoolMap, mappoolSlot } = components;

        if (!mappoolMap.customBeatmap && !mappoolMap.beatmap) {
            await respond(m, `**${mappoolSlot}** currently doesn't have a beatmap`);
            return;
        }

        const link = mappoolMap.beatmap ? `https://osu.direct/api/d/${mappoolMap.beatmap.beatmapsetID}` : mappoolMap.customBeatmap?.link;
        const md5 = mappoolMap.beatmap?.md5 ?? mappoolMap.customBeatmap?.md5;
        if (!link) {
            await respond(m, `**${mappoolSlot}** currently doesn't have a beatmap`);
            return;
        }

        const mapReplay = await MappoolReplay
            .createQueryBuilder("replay")
            .innerJoin("replay.mappoolMap", "map")
            .where("map.ID = :mapID", { mapID: mappoolMap.ID })
            .getOne();

        if (!mapReplay) {
            await respond(m, `Map: ${link}\nReplay: No replay`);
            return;
        }

        await respond(m, `Map: ${link}\nReplay: ${mapReplay.link}${md5 !== mapReplay.beatmapMD5 ? `\nThis replay may be for a different beatmap!\nMap MD5: ${md5}\nReplay MD5: ${mapReplay.beatmapMD5}` : ""}`);
        return;
    }
    if (slot && order) {
        await respond(m, `**${pool} ${slot}${order}** currently doesn't have a beatmap`);
        return;
    }

    if ("slotMod" in components) {
        const { slotMod } = components;

        const replays = await MappoolReplay
            .createQueryBuilder("replay")
            .innerJoinAndSelect("replay.mappoolMap", "map")
            .innerJoin("map.slot", "slot")
            .where("slot.ID = :slotID", { slotID: slotMod.ID })
            .getMany();

        await respond(m, slotMod.maps.map(map => {
            const link = map.beatmap ? `https://osu.direct/api/d/${map.beatmap.beatmapsetID}` : map.customBeatmap?.link;
            if (!link)
                return `**${slotMod.acronym.toUpperCase()}${slotMod.maps.length === 1 ? "" : map.order}**: No map`;

            const mapReplay = replays.find(replay => replay.mappoolMap!.ID === map.ID);
            if (!mapReplay)
                return `**${slotMod.acronym.toUpperCase()}${slotMod.maps.length === 1 ? "" : map.order}**:\nMap: ${link}\nReplay: No replay`;
    
            const md5 = map.beatmap?.md5 ?? map.customBeatmap?.md5;
            return `**${slotMod.acronym.toUpperCase()}${slotMod.maps.length === 1 ? "" : map.order}**:\nMap: ${link}\nReplay: ${mapReplay.link}${md5 !== mapReplay.beatmapMD5 ? `\nThis replay may be for a different beatmap!\nMap MD5: ${md5}\nReplay MD5: ${mapReplay.beatmapMD5}` : ""}`;
        }).join("\n\n"));

        return;
    }

    const replays = await MappoolReplay
        .createQueryBuilder("replay")
        .innerJoinAndSelect("replay.mappoolMap", "map")
        .innerJoin("map.slot", "slot")
        .innerJoin("slot.mappool", "mappool")
        .where("mappool.ID = :mappoolID", { mappoolID: mappool.ID })
        .getMany();

    await respond(m, mappool.slots.map(slot => slot.maps.map(map => {
        const link = map.beatmap ? `https://osu.direct/api/d/${map.beatmap.beatmapsetID}` : map.customBeatmap?.link;
        if (!link)
            return `**${slot.acronym.toUpperCase()}${slot.maps.length === 1 ? "" : map.order}**: No map`;

        const mapReplay = replays.find(replay => replay.mappoolMap!.ID === map.ID);
        if (!mapReplay)
            return `**${slot.acronym.toUpperCase()}${slot.maps.length === 1 ? "" : map.order}**:\nMap: ${link}\nReplay: No replay`;

        const md5 = map.beatmap?.md5 ?? map.customBeatmap?.md5;
        return `**${slot.acronym.toUpperCase()}${slot.maps.length === 1 ? "" : map.order}**:\nMap: ${link}\nReplay: ${mapReplay.link}${md5 !== mapReplay.beatmapMD5 ? `\nThis replay may be for a different beatmap!\nMap MD5: ${md5}\nReplay MD5: ${mapReplay.beatmapMD5}` : ""}}`;
    }).join("\n\n")).join("\n\n"));
}

const data = new SlashCommandBuilder()
    .setName("mappool_replay_download")
    .setDescription("Download replays and beatmaps for a mappool.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to download.")
            .setRequired(false))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot to download.")
            .setRequired(false))
    .setDMPermission(false);

interface parameters {
    pool?: string,
    slot?: string,
    order?: number,
}

const mappoolReplayDownload: Command = {
    data,
    alternativeNames: [ "replay_mappool_download", "mappool-replay-download", "replay-mappool-download", "mappoolreplaydownload", "replaymappooldownload", "replaypdownload", "preplaydownload", "pool_replay_download", "replay_pool_download", "pool-replay-download", "replay-pool-download", "poolreplaydownload", "replaypooldownload", "mappool_r_download", "r_mappool_download", "mappool-r-download", "r-mappool-download", "mappoolrdownload", "rmappooldownload", "rpdownload", "prdownload", "pool_r_download", "r_pool_download", "pool-r-download", "r-pool-download", "poolrdownload", "rpooldownload", "replay_mappool_dl", "mappool_replay_dl", "replay-mappool-dl", "mappoolreplaydl", "replaymappooldl", "replaypdl", "preplaydl", "pool_replay_dl", "replay_pool_dl", "pool-replay-dl", "replay-pool-dl", "poolreplaydl", "replaypooldl", "mappool_r_dl", "r_mappool_dl", "mappool-r-dl", "r-mappool-dl", "mappoolrdl", "rmappooldl", "rpdl", "prdl", "pool_r_dl", "r_pool_dl", "pool-r-dl", "r-pool-dl", "poolrdl", "rpooldl", "replay_mappool_download", "mappool_replay_download", "replay-mappool-download", "mappoolreplaydownload", "replaymappooldownload", "replaypdownload", "preplaydownload", "pool_replay_download", "replay_pool_download", "pool-replay-download", "replay-pool-download", "poolreplaydownload", "replaypooldownload", "mappool_r_download", "r_mappool_download", "mappool-r-download", "r-mappool-download", "mappoolrdownload", "rmappooldownload", "rpdownload", "prdownload", "pool_r_download", "r_pool_download", "pool-r-download", "r-pool-download", "poolrdownload", "rpooldownload", "replay_mappool_dl", "mappool_replay_dl", "replay-mappool-dl", "mappoolreplaydl", "replaymappooldl", "replaypdl", "preplaydl", "pool_replay_dl", "replay_pool_dl", "pool-replay-dl", "replay-pool-dl", "poolreplaydl", "replaypooldl", "mappool_r_dl", "r_mappool_dl", "mappool-r-dl", "r-mappool-dl", "mappoolrdl", "rmappooldl", "rpdl", "prdl", "pool_r_dl", "r_pool_dl"],
    category: "tournaments",
    subCategory: "mappools/replay",
    run,
};

export default mappoolReplayDownload;