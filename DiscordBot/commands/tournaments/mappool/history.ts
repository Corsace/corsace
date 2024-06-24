import { ChatInputCommandInteraction, EmbedBuilder, Message, SlashCommandBuilder } from "discord.js";
import { extractParameters } from "../../../functions/parameterFunctions";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import respond from "../../../functions/respond";
import { MappoolMapHistory } from "../../../../Models/tournaments/mappools/mappoolMapHistory";
import { Command } from "../..";
import modeColour from "../../../functions/modeColour";
import { discordStringTimestamp } from "../../../../Server/utils/dateParse";
import { TournamentRoleType, TournamentChannelType } from "../../../../Interfaces/tournament";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const params = await extractParameters<parameters>(m, [
        { name: "pool", paramType: "string" },
        { name: "slot", paramType: "string", postProcess: postProcessSlotOrder },
    ]); 
    if (!params)
        return;

    const { pool, slot, order } = params;

    const components = await mappoolComponents(m, pool, slot, order ?? true);
    if (!components || !("mappoolMap" in components)) {
        if (components && "slotMod" in components)
            await respond(m, "Invalid slot");
        return;
    }

    const { tournament, mappool, mappoolMap, mappoolSlot } = components;

    if (!mappool.isPublic && !await securityChecks(m, true, false, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers, TournamentChannelType.Jobboard], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers]))
        return;

    const history = await MappoolMapHistory
        .createQueryBuilder("history")
        .leftJoinAndSelect("history.mappoolMap", "mappoolMap")
        .leftJoinAndSelect("history.createdBy", "createdBy")
        .leftJoinAndSelect("history.beatmap", "beatmap")
        .leftJoinAndSelect("beatmap.beatmapset", "beatmapset")
        .where("mappoolMap.ID = :mappoolMapID", { mappoolMapID: mappoolMap.ID })
        .orderBy("history.createdAt", "DESC")
        .getMany();

    const embed = new EmbedBuilder()
        .setTitle(`History of ${mappoolSlot}`)
        .setDescription(`**CURRENT VERSION:** ${mappoolMap.beatmap ? `${mappoolMap.beatmap.beatmapset.artist} - ${mappoolMap.beatmap.beatmapset.title} [${mappoolMap.beatmap.difficulty}]` : mappoolMap.customBeatmap ? `${mappoolMap.customBeatmap.artist} - ${mappoolMap.customBeatmap.title} [${mappoolMap.customBeatmap.difficulty}]` : "No map"}`)
        .setColor(modeColour(tournament.mode.ID - 1))
        .setFields();

    for (const h of history) {
        embed.addFields({
            name: `Added by ${h.createdBy.osu.username}`,
            value: discordStringTimestamp(h.createdAt) + "\n" + (h.beatmap ? `**Beatmap:** ${h.beatmap.beatmapset.artist} - ${h.beatmap.beatmapset.title} [${h.beatmap.difficulty}]` : h.artist ? `**Custom:** ${h.artist} - ${h.title} [${h.difficulty}]\n${h.link}` : "No map(? Shouldn't happen tell VINXIS)"),
        });
    }

    if (embed.data.fields!.length === 0)
        embed.addFields({ name: "No History Found", value: "No history found for this given slot GJ ."});
        
    await respond(m, undefined, [embed]);
}

const data = new SlashCommandBuilder()
    .setName("mappool_history")
    .setDescription("View the history of a mappool slot.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool the slot is in.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot to view the history of.")
            .setRequired(true))
    .setDMPermission(false);    

interface parameters {
    pool: string,
    slot: string,
    order?: number,
}

const mappoolHistory: Command = {
    data,
    alternativeNames: [ "history_mappool", "mappool-history", "history-mappool", "mappoolhistory", "historymappool", "historyp", "phistory", "pool_history", "history_pool", "pool-history", "history-pool", "poolhistory", "historypool", "mappool_h", "h_mappool", "mappool-h", "h-mappool", "mappoolh", "hmappool", "hp", "ph", "pool_h", "h_pool", "pool-h", "h-pool", "poolh", "hpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolHistory;