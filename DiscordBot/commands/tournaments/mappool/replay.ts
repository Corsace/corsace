import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../index";
import { loginResponse } from "../../../functions/loginResponse";
import { unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { extractParameters } from "../../../functions/parameterFunctions";
import { getLink } from "../../../functions/getLink";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import respond from "../../../functions/respond";
import getUser from "../../../../Server/functions/get/getUser";
import commandUser from "../../../functions/commandUser";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import channelID from "../../../functions/channelID";
import { TournamentRoleType, TournamentChannelType } from "../../../../Interfaces/tournament";
import mappoolLog from "../../../functions/tournamentFunctions/mappoolLog";
import { MappoolReplay } from "../../../../Models/tournaments/mappools/mappoolReplay";
import { extractTargetText } from "../../../functions/tournamentFunctions/paramaterExtractionFunctions";
import getStaff from "../../../functions/tournamentFunctions/getStaff";
import { cleanLink } from "../../../../Server/utils/link";
import { judgementKeys, replayParse } from "../../../functions/replayParse";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, false, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers, TournamentChannelType.Jobboard], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers]))
        return;

    let user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const link = await getLink(m, "replay", true, false);
    if (!link)
        return;

    if (!cleanLink(link).endsWith(".osr")) {
        await respond(m, "Pleaseee provide a proper .osr file STOP TROLLING ME");
        return;
    }

    const params = await extractParameters<parameters>(m, [
        { name: "pool" , paramType: "string" },
        { name: "slot", paramType: "string", postProcess: postProcessSlotOrder },
        { name: "target", paramType: "string", customHandler: extractTargetText, optional: true },
    ]);
    if (!params)
        return;

    const { pool, slot, order, target } = params;

    const components = await mappoolComponents(m, pool, slot, order ?? true, true, { text: channelID(m), searchType: "channel" }, unFinishedTournaments, undefined, undefined, undefined, true);
    if (!components || !("mappoolMap" in components)) {
        if (components && "slotMod" in components)
            await respond(m, "Invalid slot");
        return;
    }

    const { tournament, mappool, mappoolMap, mappoolSlot } = components;

    if (target && commandUser(m).id !== target) {
        if (!await securityChecks(m, true, false, [], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]))
            return;

        user = await getStaff(m, tournament, target, [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers]);
        if (!user)
            return;
    }

    const parsedReplay = await replayParse(m, link, mappoolMap);
    if (!parsedReplay)
        return;

    if (judgementKeys.some(key => parsedReplay.judgements[key] === undefined)) {
        await respond(m, `Replay is missing the following hit judgement counts: \`${judgementKeys.filter(key => parsedReplay.judgements[key] === undefined).join(", ")}\``);
        return;
    }

    if (mappoolMap.replay)
        await mappoolMap.replay.remove();

    const replay = new MappoolReplay();
    replay.createdBy = user;
    replay.link = link;
    replay.mappoolMap = mappoolMap;
    replay.replayMD5 = parsedReplay.replay_hash;
    replay.beatmapMD5 = parsedReplay.beatmap_hash;
    replay.score = parsedReplay.score;
    replay.maxCombo = parsedReplay.max_combo;
    replay.perfect = parsedReplay.perfect;
    replay.count300 = parsedReplay.judgements.count_300!;
    replay.count100 = parsedReplay.judgements.count_100!;
    replay.count50 = parsedReplay.judgements.count_50!;
    replay.countGeki = parsedReplay.judgements.count_geki!;
    replay.countKatu = parsedReplay.judgements.count_katu!;
    replay.misses = parsedReplay.judgements.miss!;
    await replay.save();

    await respond(m, `Submitted replay for \`${mappoolSlot}\` with an epic score of \`${parsedReplay.score}\``);
    await mappoolLog(tournament, "submitReplay", user, `Replay was submitted to slot \`${mappoolSlot}\` in mappool \`${mappool.name}\` with a score of \`${parsedReplay.score}\``);
    return;
}

const data = new SlashCommandBuilder()
    .setName("mappool_replay")
    .setDescription("Submit a replay for a map.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to submit to.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot to submit to.")
            .setRequired(true))
    .addAttachmentOption(option =>
        option.setName("replay")
            .setDescription("The replay to submit.")
            .setRequired(true))
    .addUserOption(option =>
        option.setName("user")
            .setDescription("The user who did the replay (for organizers).")
            .setRequired(false))
    .setDMPermission(false);

interface parameters {
    pool: string;
    slot: string;
    order?: number;
    target?: string,
}

const mappoolReplay: Command = {
    data,
    alternativeNames: [ "replay_mappool", "mappool-replay", "replay-mappool", "mappoolreplay", "replaymappool", "replayp", "preplay", "pool_replay", "replay_pool", "pool-replay", "replay-pool", "poolreplay", "replaypool", "mappool_r", "r_mappool", "mappool-r", "r-mappool", "mappoolr", "rmappool", "rp", "pr", "pool_r", "r_pool", "pool-r", "r-pool", "poolr", "rpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolReplay;