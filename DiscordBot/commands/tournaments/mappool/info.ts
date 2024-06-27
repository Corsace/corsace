import { Message, SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { Command } from "../../index";
import { osuClient } from "../../../../Server/osu";
import { Beatmap as APIBeatmap, Mode } from "nodesu";
import beatmapEmbed from "../../../functions/beatmapEmbed";
import modeColour from "../../../functions/modeColour";
import { applyMods, modsToAcronym } from "../../../../Interfaces/mods";
import respond from "../../../functions/respond";
import getMappools from "../../../../Server/functions/get/getMappools";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import { extractParameters } from "../../../functions/parameterFunctions";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import channelID from "../../../functions/channelID";
import { discordStringTimestamp } from "../../../../Server/utils/dateParse";
import { TournamentRoleType, TournamentChannelType } from "../../../../Interfaces/tournament";
import customBeatmapToNodesu from "../../../../Server/functions/tournaments/mappool/customBeatmapToNodesu";
import { EmbedBuilder } from "../../../functions/embedBuilder";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const params = await extractParameters<parameters>(m, [
        { name: "pool", paramType: "string", optional: true },
        { name: "slot", paramType: "string", postProcess: postProcessSlotOrder, optional: true },
    ]);
    if (!params)
        return;

    const { pool, slot, order } = params;
    if (!pool) {
        // Get a list of the tournament's mappools instead
        const tournament = await getTournament(m, channelID(m), "channel");
        if (!tournament) 
            return;

        const mappools = await getMappools(tournament, "", false, true, true);
        if (mappools.length === 0) {
            await respond(m, `No mappools found for ${tournament.name}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`Mappools for ${tournament.name}`)
            .addFields(mappools.map(mappool => ({
                name: `**${mappool.name}**`,
                value: `${mappool.slots.map(slot => `${slot.name}: ${slot.maps.length}`).join("\n")}\n${mappool.isPublic ? `Link: ${mappool.mappackLink}` : ""}`,
                inline: true,
            })))
            .setColor(modeColour(tournament.mode.ID - 1))
            .setFooter({
                text: `Requested by ${m.member?.user.username}`,
                icon_url: (m.member as GuildMember | null)?.displayAvatarURL() ?? undefined,
            })
            .setTimestamp();
        await respond(m, undefined, embed);
        return;
    }

    const components = await mappoolComponents(m, pool, slot ?? true, order ?? true, undefined, { text: channelID(m), searchType: "channel" }, undefined, undefined, undefined, true);
    if (!components || !("mappool" in components))
        return;

    const { tournament, mappool } = components;
    
    if (!mappool.isPublic && !await securityChecks(m, true, false, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers, TournamentChannelType.Jobboard], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers]))
        return;

    if ("mappoolMap" in components) {

        const { mappoolMap, mappoolSlot, slotMod } = components;

        if (mappoolMap.beatmap) {
            const set = (await osuClient.beatmaps.getBySetId(mappoolMap.beatmap.beatmapsetID, Mode.all, undefined, undefined, slotMod.allowedMods ?? 0) as APIBeatmap[]);
            const apiMap = set.find(m => m.beatmapId === mappoolMap.beatmap!.ID)!;

            const mappoolMapEmbed = await beatmapEmbed(apiMap, modsToAcronym(slotMod.allowedMods ?? 0), set);
            mappoolMapEmbed.embed.author!.name = `${mappoolSlot}: ${mappoolMapEmbed.embed.author!.name}`;

            await respond(m, `Info for **${mappoolSlot}**:`, mappoolMapEmbed);
            return;
        }

        if (!mappoolMap.customBeatmap?.link) {
            await respond(m, `**${mappoolSlot}** currently has no beatmap`);
            return;
        }

        const nodesuBeatmap = customBeatmapToNodesu({...mappoolMap, customBeatmap: mappoolMap.customBeatmap});
        const mappoolMapEmbed = await beatmapEmbed(applyMods(nodesuBeatmap, modsToAcronym(slotMod.allowedMods ?? 0)), modsToAcronym(slotMod.allowedMods ?? 0), [nodesuBeatmap]);
        mappoolMapEmbed.embed.author!.name = `${mappoolSlot}: ${mappoolMapEmbed.embed.author!.name}`;
        
        await respond(m, `Info for **${mappoolSlot}**:\n\n${mappoolMap.customThreadID ? `Thread: <#${mappoolMap.customThreadID}>\n` : ""}${mappoolMap.deadline ? `Deadline: ${discordStringTimestamp(mappoolMap.deadline)}` : ""}`, mappoolMapEmbed);
        return;
    }

    if ("slotMod" in components) {
        const { slotMod } = components;

        const embed = new EmbedBuilder()
            .setTitle(`Info for ${slotMod.name}`)
            .setDescription(`**Acronym:** ${modsToAcronym(slotMod.allowedMods ?? 0)}\n**Mode:** ${tournament.mode.name}\n**Mappool:** ${mappool.name} (${mappool.abbreviation.toUpperCase()})\n**Allowed Mods:** ${modsToAcronym(slotMod.allowedMods ?? 0)}`)
            .addFields(slotMod.maps.map(map => ({
                name: `**${slotMod.acronym}${slotMod.maps.length === 1 ? "" : map.order}**`,
                value: map.beatmap ? `[${map.beatmap.beatmapset.artist} - ${map.beatmap.beatmapset.title} [${map.beatmap.difficulty}]](https://osu.ppy.sh/b/${map.beatmap.ID})` : map.customBeatmap?.link ? `[${map.customBeatmap.artist} - ${map.customBeatmap.title} [${map.customBeatmap.difficulty}]](${map.customBeatmap.link})` : map.customBeatmap ? `${map.customBeatmap.artist} - ${map.customBeatmap.title} [${map.customBeatmap.difficulty}]` : "No beatmap",
            })))
            .setColor(modeColour(tournament.mode.ID - 1));

        await respond(m, `Info for **${slotMod.name}**:`, embed);
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`Info for ${mappool.name} (${mappool.abbreviation.toUpperCase()})`)
        .setDescription(`**ID:** ${mappool.ID}\n**Target SR:** ${mappool.targetSR}\n**Mappack Link:** ${mappool.mappackLink ?? "N/A"}\n**Mappack Expiry:** ${mappool.mappackExpiry ? discordStringTimestamp(mappool.mappackExpiry) : "N/A"}`)
        .addFields(mappool.slots.map(slot => ({
            name: `**${slot.name}**`,
            value: slot.maps.map(map => `**${slot.acronym}${slot.maps.length === 1 ? "" : map.order}:** ${map.beatmap ? `[${map.beatmap.beatmapset.artist} - ${map.beatmap.beatmapset.title} [${map.beatmap.difficulty}]](https://osu.ppy.sh/b/${map.beatmap.ID})` : map.customBeatmap?.link ? `[${map.customBeatmap.artist} - ${map.customBeatmap.title} [${map.customBeatmap.difficulty}]](${map.customBeatmap.link})` : "N/A"}`).join("\n"),
            inline: true,
        })))
        .setColor(modeColour(tournament.mode.ID - 1))
        .setFooter({
            text: `Requested by ${m.member?.user.username}`,
            icon_url: (m.member as GuildMember | null)?.displayAvatarURL() ?? undefined,
        })
        .setTimestamp();
    
    await respond(m, undefined, embed);
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