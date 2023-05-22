import { Message, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../../index";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { osuClient } from "../../../../Server/osu";
import { Beatmap as APIBeatmap, Mode } from "nodesu";
import beatmapEmbed from "../../../functions/beatmapEmbed";
import modeColour from "../../../functions/modeColour";
import { applyMods, modsToAcronym } from "../../../../Interfaces/mods";
import respond from "../../../functions/respond";
import getMappools from "../../../functions/dbFunctions/getMappools";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import { extractParameters } from "../../../functions/parameterFunctions";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const params = extractParameters<parameters>(m, [
        { name: "pool", regex: /-p (\S+)/, regexIndex: 1, optional: true },
        { name: "slot", regex: /-s (\S+)/, regexIndex: 1, postProcess: postProcessSlotOrder, optional: true },
    ]);
    if (!params)
        return;

    const { pool, slot, order } = params;
    if (!pool) {
        // Get a list of the tournament's mappools instead
        const tournament = await getTournament(m);
        if (!tournament) 
            return;

        const mappools = await getMappools(tournament, "", false, true, true)
        if (mappools.length === 0) {
            await respond(m, `No mappools found for ${tournament.name}.`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`Mappools for ${tournament.name}`)
            .setFields(mappools.map(mappool => ({
                name: `**${mappool.name}**`,
                value: `${mappool.slots.map(slot => `${slot.name}: ${slot.maps.length}`).join("\n")}\n${mappool.isPublic ? `Link: ${mappool.mappackLink}` : ""}`,
                inline: true,
            })))
            .setColor(modeColour(tournament.mode.ID - 1))
            .setFooter({
                text: `Requested by ${m.member?.user.username}#${m.member?.user.discriminator}`,
                iconURL: m.member?.avatar ?? undefined,
            })
            .setTimestamp();
        await respond(m, undefined, [embed]);
        return;
    }

    const components = await mappoolComponents(m, pool, slot, order);
    if (!components || !("mappool" in components))
        return;

    const { tournament, mappool } = components;
    
    if (!mappool.isPublic && !await securityChecks(m, true, false, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers, TournamentChannelType.Jobboard], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers]))
        return;

    if ("mappoolMap" in components) {

        const { mappoolMap, mappoolSlot, slotMod } = components;

        if (mappoolMap.beatmap) {
            const set = (await osuClient.beatmaps.getBySetId(mappoolMap.beatmap.beatmapsetID, Mode.all, undefined, undefined, slotMod.allowedMods) as APIBeatmap[]);
            const apiMap = set.find(m => m.beatmapId === mappoolMap.beatmap!.ID)!;

            const mappoolMapEmbed = await beatmapEmbed(apiMap, modsToAcronym(slotMod.allowedMods), set);
            mappoolMapEmbed.data.author!.name = `${mappoolSlot}: ${mappoolMapEmbed.data.author!.name}`;

            await respond(m, `Info for **${mappoolSlot}**:`, [mappoolMapEmbed]);
            return;
        }

        if (!mappoolMap.customBeatmap?.link) {
            await respond(m, `**${mappoolSlot}** currently has no beatmap.`);
            return;
        }

        const apiBeatmap = new APIBeatmap({
            "beatmapset_id": "-1",
            "beatmap_id": "-1",
            "approved": "-3",
            "total_length": `${mappoolMap.customBeatmap.totalLength}`,
            "hit_length": `${mappoolMap.customBeatmap.hitLength}`,
            "version": mappoolMap.customBeatmap.difficulty,
            "file_md5": "",
            "diff_size": `${mappoolMap.customBeatmap.circleSize}`,
            "diff_overall": `${mappoolMap.customBeatmap.overallDifficulty}`,
            "diff_approach": `${mappoolMap.customBeatmap.approachRate}`,
            "diff_drain": `${mappoolMap.customBeatmap.hpDrain}`,
            "mode": `${mappoolMap.customBeatmap.mode.ID - 1}`,
            "count_normal": `${mappoolMap.customBeatmap.circles}`,
            "count_slider": `${mappoolMap.customBeatmap.sliders}`,
            "count_spinner": `${mappoolMap.customBeatmap.spinners}`,
            "submit_date": [mappoolMap.createdAt.getUTCMonth()+1,
                mappoolMap.createdAt.getUTCDate(),
                mappoolMap.createdAt.getUTCFullYear()].join('/')+' '+
               [mappoolMap.createdAt.getUTCHours(),
                mappoolMap.createdAt.getUTCMinutes(),
                mappoolMap.createdAt.getUTCSeconds()].join(':'),
            "approved_date": null,
            "last_update": [mappoolMap.lastUpdate.getUTCMonth()+1,
                mappoolMap.lastUpdate.getUTCDate(),
                mappoolMap.lastUpdate.getUTCFullYear()].join('/')+' '+
               [mappoolMap.lastUpdate.getUTCHours(),
                mappoolMap.lastUpdate.getUTCMinutes(),
                mappoolMap.lastUpdate.getUTCSeconds()].join(':'),
            "artist": mappoolMap.customBeatmap.artist,
            "artist_unicode": mappoolMap.customBeatmap.artist,
            "title": mappoolMap.customBeatmap.title,
            "title_unicode": mappoolMap.customBeatmap.title,
            "creator": mappoolMap.customMappers.map(u => u.osu.username).join(", "),
            "creator_id": "-1",
            "bpm": `${mappoolMap.customBeatmap.BPM}`,
            "source": "",
            "tags": `${mappoolMap.customBeatmap.link ?? ""}`,
            "genre_id": "0",
            "language_id": "0",
            "favourite_count": "0",
            "rating": "0",
            "storyboard": "0",
            "video": "0",
            "download_unavailable": "0",
            "audio_unavailable": "0",
            "playcount": "0",
            "passcount": "0",
            "packs": null,
            "max_combo": mappoolMap.customBeatmap.maxCombo ? `${mappoolMap.customBeatmap.maxCombo}` : null,
            "diff_aim": mappoolMap.customBeatmap.aimSR ? `${mappoolMap.customBeatmap.aimSR}` : null,
            "diff_speed": mappoolMap.customBeatmap.speedSR ? `${mappoolMap.customBeatmap.speedSR}` : null,
            "difficultyrating": `${mappoolMap.customBeatmap.totalSR}`,
        });
        const set = [apiBeatmap];
        const mappoolMapEmbed = await beatmapEmbed(applyMods(apiBeatmap, modsToAcronym(slotMod.allowedMods ?? 0)), modsToAcronym(slotMod.allowedMods ?? 0), set);
        mappoolMapEmbed.data.author!.name = `${mappoolSlot}: ${mappoolMapEmbed.data.author!.name}`;
        
        await respond(m, `Info for **${mappoolSlot}**:`, [mappoolMapEmbed]);
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`Info for ${mappool.name} (${mappool.abbreviation.toUpperCase()})`)
        .setFields(mappool.slots.map(slot => ({
            name: `**${slot.name}**`,
            value: slot.maps.map(map => `**${slot.acronym}${map.order}:** ${map.beatmap ? `[${map.beatmap.beatmapset.artist} - ${map.beatmap.beatmapset.title} [${map.beatmap.difficulty}]](https://osu.ppy.sh/b/${map.beatmap.ID})` : map.customBeatmap && map.customBeatmap.link ? `[${map.customBeatmap.artist} - ${map.customBeatmap.title} [${map.customBeatmap.difficulty}]](${map.customBeatmap.link})` : "N/A"}`).join("\n"),
            inline: true,
        })))
        .setColor(modeColour(tournament.mode.ID - 1))
        .setFooter({
            text: `Requested by ${m.member?.user.username}#${m.member?.user.discriminator}`,
            iconURL: m.member?.avatar ?? undefined,
        })
        .setTimestamp();
    
    await respond(m, undefined, [embed]);
}

interface parameters {
    pool?: string,
    slot?: string,
    order?: number,
}

const data = new SlashCommandBuilder()
    .setName("mappool_info")
    .setDescription("A list of the tournament's pools, a list of a mappool's slots, or info about a specific slot.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to get a list of slots for. (Empty will get a list of the tournament's mappools)")
            .setRequired(false))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot to get info for.")
            .setRequired(false));

const mappoolInfo: Command = {
    data,
    alternativeNames: [ "info_mappool", "mappool-info", "info-mappool", "mappoolinfo", "infomappool", "infop", "pinfo", "pool_info", "info_pool", "pool-info", "info-pool", "poolinfo", "infopool", "mappool_inf", "inf_mappool", "mappool-inf", "inf-mappool", "mappoolinf", "infmappool", "infp", "pinf", "pool_inf", "inf_pool", "pool-inf", "inf-pool", "poolinf", "infpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolInfo;