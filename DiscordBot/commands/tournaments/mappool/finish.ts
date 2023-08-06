import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../index";
import { unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import { Beatmap } from "../../../../Models/beatmap";
import { Beatmap as APIBeatmap } from "nodesu";
import { osuClient } from "../../../../Server/osu";
import { insertBeatmap } from "../../../../Server/scripts/fetchYearMaps";
import { loginResponse } from "../../../functions/loginResponse";
import { MappoolMapHistory } from "../../../../Models/tournaments/mappools/mappoolMapHistory";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { deletePack } from "../../../../Server/functions/tournaments/mappool/mappackFunctions";
import { extractParameters } from "../../../functions/parameterFunctions";
import { extractTargetText } from "../../../functions/tournamentFunctions/paramaterExtractionFunctions";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import beatmapEmbed from "../../../functions/beatmapEmbed";
import respond from "../../../functions/respond";
import getUser from "../../../../Server/functions/get/getUser";
import channelID from "../../../functions/channelID";
import commandUser from "../../../functions/commandUser";
import mappoolLog from "../../../functions/tournamentFunctions/mappoolLog";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import { TournamentRoleType, TournamentChannelType } from "../../../../Interfaces/tournament";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const check = await securityChecks(m, true, false, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers, TournamentChannelType.Jobboard], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]);
    if (!check)
        return;

    const params = extractParameters<parameters>(m, [
        { name: "pool", paramType: "string" },
        { name: "slot", paramType: "string", postProcess: postProcessSlotOrder },
        { name: "target", paramType: "string", customHandler: extractTargetText },
    ]); 
    if (!params)
        return;

    const { target, pool, slot, order } = params;

    const components = await mappoolComponents(m, pool, slot, order || true, true, { text: channelID(m), searchType: "channel" }, unFinishedTournaments, false, undefined, true);
    if (!components || !("mappoolMap" in components)) {
        if (components && "slotMod" in components)
            await respond(m, "Invalid slot");
        return;
    }
    const { tournament, mappool, slotMod, mappoolMap, mappoolSlot } = components;

    const assigner = await getUser(commandUser(m).id, "discord", false);
    if (!assigner) {
        await loginResponse(m);
        return;
    }

    const linkRegex = /https?:\/\/osu.ppy.sh\/beatmapsets\/(\d+)#(osu|taiko|fruits|mania)\/(\d+)/;
    const link = target.match(linkRegex);
    if (!link) {
        await respond(m, "Invalid link. Use a valid osu! beatmap link that contains the set id and beatmap id (e.g. https://osu.ppy.sh/beatmapsets/1234567#osu/1234567)");
        return;
    }
    const beatmapID = parseInt(link[3]);
    
    const set = await osuClient.beatmaps.getBySetId(parseInt(link[1])) as APIBeatmap[];
    let apiMap = set.find(m => m.beatmapId === beatmapID);
    if (!apiMap) {
        await respond(m, "Can't find the beatmap via osu!api");
        return;
    }
    if (apiMap.mode !== tournament.mode.ID - 1) {
        await respond(m, "Beatmap mode doesn't match tournament mode");
        return;
    }

    let beatmap = await Beatmap.findOne({
        where: {
            ID: beatmapID,
        },
        relations: ["beatmapset"],
    });
    if (!beatmap)
        beatmap = await insertBeatmap(apiMap);
    else if (await MappoolMap
        .createQueryBuilder("mappoolMap")
        .leftJoin("mappoolMap.beatmap", "beatmap")
        .leftJoin("mappoolMap.slot", "slot")
        .leftJoin("slot.mappool", "mappool")
        .leftJoin("mappool.stage", "stage")
        .leftJoin("stage.tournament", "tournament")
        .where("beatmap.ID = :id", { id: beatmap.ID })
        .andWhere("tournament.ID = :tournament", { tournament: tournament.ID })
        .getExists()) {
        await respond(m, `The beatmap ur trying to add is already in **${tournament.name}**`);
        return;
    }

    if (mappoolMap.beatmap && mappoolMap.beatmap.ID === beatmap.ID) {
        await respond(m, `**${mappoolSlot}** is already set to this beatmap`);
        return;
    }

    mappoolMap.beatmap = beatmap;
    await mappoolMap.save();

    await deletePack("mappacksTemp", mappool);

    const log = new MappoolMapHistory();
    log.createdBy = assigner;
    log.mappoolMap = mappoolMap;
    log.beatmap = beatmap;
    await log.save();

    if (slotMod.allowedMods)
        apiMap = (await osuClient.beatmaps.getBySetId(parseInt(link[1]), undefined, undefined, undefined, slotMod.allowedMods) as APIBeatmap[]).find(m => m.beatmapId === beatmapID)!;
    const mappoolMapEmbed = await beatmapEmbed(apiMap, slot, set);
    mappoolMapEmbed.data.author!.name = `${mappoolSlot}: ${mappoolMapEmbed.data.author!.name}`;

    await respond(m, `Set **${mappoolSlot}** as finished, and to **${beatmap.beatmapset.artist} - ${beatmap.beatmapset.title} [${beatmap.difficulty}]**`, [mappoolMapEmbed]);

    await mappoolLog(tournament, "finishedMap", assigner, log, mappoolSlot);
    return;
}

const data = new SlashCommandBuilder()
    .setName("mappool_finish")
    .setDescription("Provide a final link to the uploaded custom beatmap.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool the slot is in.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot to provide a finsihed beatmap for.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("link")
            .setDescription("The beatmap link.")
            .setRequired(true))
    .setDMPermission(false);

interface parameters {
    target: string,
    pool: string,
    slot: string,
    order?: number,
}

const mappoolFinish: Command = {
    data,
    alternativeNames: [ "finish_mappool", "mappool-finish", "finish-mappool", "mappoolfinish", "finishmappool", "finishp", "pfinish", "pool_finish", "finish_pool", "pool-finish", "finish-pool", "poolfinish", "finishpool", "mappool_f", "f_mappool", "mappool-f", "f-mappool", "mappoolf", "fmappool", "fp", "pf", "pool_f", "f_pool", "pool-f", "f-pool", "poolf", "fpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolFinish;