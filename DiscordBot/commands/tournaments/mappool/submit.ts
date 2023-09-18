import { ChatInputCommandInteraction, GuildMemberRoleManager, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../index";
import { loginResponse } from "../../../functions/loginResponse";
import { unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { extractParameters } from "../../../functions/parameterFunctions";
import { getLink } from "../../../functions/getLink";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import { beatmapParse, parsedBeatmapToCustom } from "../../../functions/beatmapParse";
import respond from "../../../functions/respond";
import getUser from "../../../../Server/functions/get/getUser";
import commandUser from "../../../functions/commandUser";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import bypassSubmit from "../../../functions/tournamentFunctions/bypassSubmit";
import channelID from "../../../functions/channelID";
import { TournamentRoleType, TournamentChannelType } from "../../../../Interfaces/tournament";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, false, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers, TournamentChannelType.Jobboard], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers]))
        return;

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const link = await getLink(m, "map", true, false);
    if (!link)
        return;

    if (!link.endsWith(".osz")) {
        await respond(m, "Pleaseee provide a proper .osz file STOP TROLLING ME");
        return;
    }

    const params = extractParameters<parameters>(m, [
        { name: "pool" , paramType: "string"},
        { name: "slot", paramType: "string", postProcess: postProcessSlotOrder },
        { name: "difficulty", paramType: "string", optional: true },
    ]);
    if (!params)
        return;

    const { pool, slot, order, difficulty } = params;

    const components = await mappoolComponents(m, pool, slot, order || true, true, { text: channelID(m), searchType: "channel" }, unFinishedTournaments);
    if (!components || !("mappoolMap" in components)) {
        if (components && "slotMod" in components)
            await respond(m, "Invalid slot");
        return;
    }

    const { tournament, mappool, slotMod, mappoolMap, mappoolSlot } = components;

    // Check if they are assigned to the map or if they can bypass the check
    if (!await bypassSubmit(m.member!.roles as GuildMemberRoleManager, tournament) && !mappoolMap.customMappers.some(mapper => mapper.discord.userID === commandUser(m).id)) {
        await respond(m, "Ur not assigned to this map");
        return;
    }

    // Obtain beatmap data
    const beatmapData = await beatmapParse(m, difficulty || "", link, slotMod.allowedMods ?? 0);
    if (!beatmapData?.beatmap) {
        await respond(m, `Can't find **${difficulty !== "" ? `[${difficulty}]` : "a single difficulty(????)"}** in ur osz`);
        return;
    }

    await parsedBeatmapToCustom(m, tournament, mappool, slotMod, mappoolMap, beatmapData, link, user, mappoolSlot);
    return;
}

const data = new SlashCommandBuilder()
    .setName("mappool_submit")
    .setDescription("Submit a map to a mappool.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to submit to.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot to submit to.")
            .setRequired(true))
    .addAttachmentOption(option =>
        option.setName("map")
            .setDescription("The map to submit.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("difficulty")
            .setDescription("The difficulty to submit. (Default: First difficulty it finds)")
            .setRequired(false))
    .setDMPermission(false);

interface parameters {
    pool: string;
    slot: string;
    order?: number;
    difficulty?: string;
}

const mappoolSubmit: Command = {
    data,
    alternativeNames: [ "submit_mappool", "mappool-submit", "submit-mappool", "mappoolsubmit", "submitmappool", "submitp", "psubmit", "pool_submit", "submit_pool", "pool-submit", "submit-pool", "poolsubmit", "submitpool", "mappool_s", "s_mappool", "mappool-s", "s-mappool", "mappools", "smappool", "sp", "ps", "pool_s", "s_pool", "pool-s", "s-pool", "pools", "spool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolSubmit;