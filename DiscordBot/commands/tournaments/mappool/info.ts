import { Message, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../../index";
import { fetchMappool, fetchSlot, fetchTournament, hasTournamentRoles, isSecuredChannel } from "../../../functions/tournamentFunctions";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { osuClient } from "../../../../Server/osu";
import { Beatmap as APIBeatmap, Mode } from "nodesu";
import beatmapEmbed from "../../../functions/beatmapEmbed";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import modeColour from "../../../functions/modeColour";
import { applyMods, modsToAcronym } from "../../../../Interfaces/mods";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const tournament = await fetchTournament(m);
    if (!tournament) 
        return;

    const allowed = await hasTournamentRoles(m, tournament, [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers]);
    if (!allowed) 
        return;

    const poolRegex = /-p (\S+)/;
    const slotRegex = /-s (\S+)/;
    const poolText = m instanceof Message ? m.content.match(poolRegex) ?? m.content.split(" ")[1] : m.options.getString("pool");
    const slotText = m instanceof Message ? m.content.match(slotRegex) ?? m.content.split(" ")[2] : m.options.getString("slot");
    if (!poolText) {
        // Get a list of the tournament's mappools instead
        const mappools = await Mappool.search(tournament, "", false, true, true);
        if (mappools.length === 0) {
            if (m instanceof Message) m.reply(`No mappools found for ${tournament.name}.`);
            else m.editReply(`No mappools found for ${tournament.name}.`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`Mappools for ${tournament.name}`)
            .setFields(mappools.map(mappool => ({
                name: `**${mappool.name}**`,
                value: `${mappool.slots.map(slot => `${slot.name}: ${slot.maps.length}`).join("\n")}\n${mappool.isPublic || (mappool.mappackExpiry?.getTime() ?? -1) > Date.now() ? `Link: ${mappool.mappack}` : ""}`,
                inline: true,
            })))
            .setColor(modeColour(tournament.mode.ID - 1))
            .setFooter({
                text: `Requested by ${m.member?.user.username}#${m.member?.user.discriminator}`,
                iconURL: m.member?.avatar ?? undefined,
            })
            .setTimestamp();
        if (m instanceof Message) m.reply({ embeds: [embed] });
        else m.editReply({ embeds: [embed] });
        return;
    }

    const pool = typeof poolText === "string" ? poolText : poolText[0];

    const mappool = await fetchMappool(m, tournament, pool, false, slotText ? false : true, slotText ? false : true);
    if (!mappool) 
        return;
    
    if (!mappool.isPublic) {
        const securedChannel = await isSecuredChannel(m, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers, TournamentChannelType.Jobboard]);
        if (!securedChannel) 
            return;
    }

    if (slotText) {
        const slot = (typeof slotText === "string" ? slotText.substring(0, slotText.length - 1) : slotText[1].substring(0, slotText[1].length - 1)).toUpperCase();
        const order = parseInt(typeof slotText === "string" ? slotText.substring(slotText.length - 1) : slotText[1].substring(slotText[1].length - 1));
        if (isNaN(order)) {
            if (m instanceof Message) m.reply(`Invalid slot number **${order}**. Please use a valid slot number.`);
            else m.editReply(`Invalid slot number **${order}**. Please use a valid slot number.`);
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

        if (mappoolMap.beatmap) {
            const set = (await osuClient.beatmaps.getBySetId(mappoolMap.beatmap.beatmapsetID, Mode.all, undefined, undefined, slotMod.allowedMods) as APIBeatmap[]);
            const apiMap = set.find(m => m.beatmapId === mappoolMap.beatmap!.ID)!;

            const mappoolMapEmbed = await beatmapEmbed(apiMap, slotMod.acronym, set);
            mappoolMapEmbed.data.author!.name = `${mappoolSlot}: ${mappoolMapEmbed.data.author!.name}`;

            if (m instanceof Message) m.reply({
                content: `Info for **${mappoolSlot}**:`,
                embeds: [mappoolMapEmbed],
            });
            else m.editReply({
                content: `Info for **${mappoolSlot}**:`,
                embeds: [mappoolMapEmbed],
            });
            return;
        }

        if (!mappoolMap.customBeatmap?.link) {
            if (m instanceof Message) m.reply(`**${mappoolSlot}** currently has no beatmap.`);
            else m.editReply(`**${mappoolSlot}** currently has no beatmap.`);
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
        
        if (m instanceof Message) m.reply({
            content: `Info for **${mappoolSlot}**:`,
            embeds: [mappoolMapEmbed],
        });
        else m.editReply({
            content: `Info for **${mappoolSlot}**:`,
            embeds: [mappoolMapEmbed],
        });
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
    
    if (m instanceof Message) m.reply({ embeds: [embed] });
    else m.editReply({ embeds: [embed] });
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