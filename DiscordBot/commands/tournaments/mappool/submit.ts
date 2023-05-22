import { ChatInputCommandInteraction, GuildMemberRoleManager, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../index";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { loginResponse } from "../../../functions/loginResponse";
import { unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { extractParameters } from "../../../functions/parameterFunctions";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import { ojsamaParse, ojsamaToCustom } from "../../../functions/beatmapParse";
import respond from "../../../functions/respond";
import getUser from "../../../functions/dbFunctions/getUser";
import commandUser from "../../../functions/commandUser";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import bypassSubmit from "../../../functions/tournamentFunctions/bypassSubmit";

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

    let link: string = "";
    if (m instanceof Message) {
        if (m.attachments.first())
            link = m.attachments.first()!.url;
        else if (/https?:\/\/\S+/.test(m.content)) {
            link = /https?:\/\/\S+/.exec(m.content)![0];
            m.content = m.content.replace(link, "");
        } else {
            m.reply("Please provide a link to the map.");
            return;
        }
    } else {
        const attachment = m.options.getAttachment("map");
        if (!attachment) {
            m.editReply("Please provide a link to the map.");
            return;
        }
        link = attachment.url;
    }

    if (!link.endsWith(".osz")) {
        await respond(m, "Please provide a proper .osz file.");
        return;
    }

    const params = extractParameters<parameters>(m, [
        { name: "pool", regex: /-p (\S+)/, regexIndex: 1 },
        { name: "slot", regex: /-s (\S+)/, regexIndex: 1, postProcess: postProcessSlotOrder },
        { name: "difficulty", regex: /-d (.+)/, regexIndex: 1, optional: true },
    ]);
    if (!params)
        return;

    const { pool, slot, order, difficulty } = params;

    const components = await mappoolComponents(m, pool, slot, order, true, { text: m.channelId, searchType: "channel" }, unFinishedTournaments);
    if (!components || !("mappoolMap" in components))
        return;

    const { tournament, mappool, slotMod, mappoolMap, mappoolSlot } = components;

    // Check if they are assigned to the map or if they can bypass the check
    if (!await bypassSubmit(m.member!.roles as GuildMemberRoleManager, tournament) && !mappoolMap.customMappers.some(mapper => mapper.discord.userID !== commandUser(m).id)) {
        await respond(m, "You are not assigned to this map.");
        return;
    }

    // Obtain beatmap data
    const beatmap = await ojsamaParse(m, difficulty || "", link);
    if (!beatmap) {
        await respond(m, `Could not find **${difficulty !== "" ? `[${difficulty}]` : "a single difficulty(?)"}** in your osz`);
        return;
    }

    await ojsamaToCustom(m, tournament, mappool, slotMod, mappoolMap, beatmap, link, user, mappoolSlot);
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
    order: number;
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