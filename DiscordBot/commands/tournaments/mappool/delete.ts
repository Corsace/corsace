import { ChatInputCommandInteraction, ForumChannel, Message, SlashCommandBuilder, ThreadChannel } from "discord.js";
import { Command } from "../../index";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import getUser from "../../../functions/dbFunctions/getUser";
import commandUser from "../../../functions/commandUser";
import { loginResponse } from "../../../functions/loginResponse";
import { extractParameters } from "../../../functions/parameterFunctions";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import confirmCommand from "../../../functions/confirmCommand";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import { Tournament, unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import respond from "../../../functions/respond";
import mappoolLog from "../../../functions/tournamentFunctions/mappoolLog";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { User } from "../../../../Models/user";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { CustomBeatmap } from "../../../../Models/tournaments/mappools/customBeatmap";
import { JobPost } from "../../../../Models/tournaments/mappools/jobPost";
import { discordClient } from "../../../../Server/discord";
import { deletePack } from "../../../functions/tournamentFunctions/mappackFunctions";
import { MappoolMapHistory } from "../../../../Models/tournaments/mappools/mappoolMapHistory";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, true, [], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]))
        return;

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const params = extractParameters<parameters>(m, [
        { name: "pool", regex: /-p (\S+)/, regexIndex: 1 },
        { name: "slot", regex: /-s (\S+)/, regexIndex: 2, postProcess: postProcessSlotOrder, optional: true },
    ]);
    if (!params)
        return;

    const { pool, slot, order } = params;

    const components = await mappoolComponents(m, pool, slot || true, order || true, true, { text: m.channelId, searchType: "channel" }, unFinishedTournaments, undefined, undefined, true);
    if (!components || !("mappool" in components))
        return;

    const { tournament, mappool } = components;

    if ("mappoolMap" in components && components.slotMod.maps.length > 1) {
        await deleteMap(m, tournament, mappool, user, components.mappoolMap, components.mappoolSlot);
        return;
    }

    if ("slotMod" in components) {
        await deleteSlot(m, tournament, mappool, user, components.slotMod);
        return;
    }

    await deletePool(m, tournament, mappool, user);
}

async function deleteMap (m: Message | ChatInputCommandInteraction, tournament: Tournament, mappool: Mappool, user: User, mappoolMap: MappoolMap, mappoolSlot: string) {
    const hasCustom = mappoolMap.customBeatmap ? true : false;
    const hasJobPost = mappoolMap.jobPost ? true : false;

    if (!await confirmCommand(m, `U sure u wanna delete **${mappoolSlot}**?\n${hasCustom ? "This will also delete the custom beatmap and all currently saved previous versions in the database" : ""}\n${hasJobPost ? "This will also delete the job post" : ""}`)) {
        await respond(m, "Ok w/e .");
        return;
    }

    await unlinkMap(mappoolMap);

    await deleteHistory([mappoolMap.ID]);

    await mappoolMap.remove();

    await Promise.all([
        hasCustom ? mappoolMap.customBeatmap!.remove() : Promise.resolve(),
        hasJobPost ? mappoolMap.jobPost!.remove() : Promise.resolve(),
    ]);

    await Promise.all([
        deletePack("mappacksTemp", mappool),
        respond(m, `**${mappoolSlot}** has been deleted ${hasCustom || hasJobPost ? "along with the custom beatmap and/or job posts" : ""}`),
        mappoolLog(tournament, "delete", user, `\`${mappoolSlot}\` has been deleted ${hasCustom || hasJobPost ? "along with the custom beatmap and/or job posts" : ""}`),
    ]);
    return;
}

async function deleteSlot (m: Message | ChatInputCommandInteraction, tournament: Tournament, mappool: Mappool, user: User, slotMod: MappoolSlot) {

    if (!await confirmCommand(m, `U sure u wanna delete **${slotMod.name} (${slotMod.acronym})** and all of the maps connected to it?\nIt'll also delete any custom beatmaps and all currently saved previous versions of such custom beatmaps in the database, AND/OR job posts attached to any of the map slots in this slot`)) {
        await respond(m, "Ok w/e .");
        return;
    }

    await Promise.all(slotMod.maps.map(map => unlinkMap(map)));

    await deleteHistory(slotMod.maps.map(map => map.ID));

    const maps = slotMod.maps.map(map => map.remove());
    await Promise.all(maps);

    const customMaps = slotMod.maps.map(map => map.customBeatmap).filter((customBeatmap): customBeatmap is CustomBeatmap => customBeatmap !== null && customBeatmap !== undefined).map(customBeatmap => customBeatmap.remove());
    const jobPosts = slotMod.maps.map(map => map.jobPost).filter((jobPost): jobPost is JobPost => jobPost !== null && jobPost !== undefined).map(jobPost => jobPost.remove());
    await Promise.all([...customMaps, ...jobPosts, slotMod.maps.map(map => archiveThreads(map))]);

    await slotMod.remove();

    await Promise.all([
        deletePack("mappacksTemp", mappool),
        respond(m, `**${slotMod.name.toUpperCase()} (${slotMod.acronym.toUpperCase()})** in **${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})** has been deleted`),
        mappoolLog(tournament, "delete", user, `\`${slotMod.name.toUpperCase()} (${slotMod.acronym.toUpperCase()})\` in \`${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})\` has been deleted`),
    ]);
    return;
}

async function deletePool (m: Message | ChatInputCommandInteraction, tournament: Tournament, mappool: Mappool, user: User) {
    if (!await confirmCommand(m, `U sure u wanna delete **${mappool.name} (${mappool.abbreviation})** and all of the maps connected to it?\nIt'll also delete any custom beatmaps and all currently saved previous versions of such custom beatmaps in the database, AND/OR job posts attached to any of the map slots in this pool`)) {
        await respond(m, "Ok w/e .");
        return;
    }

    await Promise.all(mappool.slots.flatMap(slot => slot.maps).map(map => unlinkMap(map)));

    await deleteHistory(mappool.slots.flatMap(slot => slot.maps.map(map => map.ID)));

    const maps = mappool.slots.flatMap(slot => slot.maps.map(map => map.remove()));
    await Promise.all(maps);

    const customMaps = mappool.slots.map(slot => slot.maps.map(map => map.customBeatmap).filter((customBeatmap): customBeatmap is CustomBeatmap => customBeatmap !== null && customBeatmap !== undefined).map(customBeatmap => customBeatmap.remove()));
    const jobPosts = mappool.slots.map(slot => slot.maps.map(map => map.jobPost).filter((jobPost): jobPost is JobPost => jobPost !== null && jobPost !== undefined).map(jobPost => jobPost.remove()));
    const threadArchiving = mappool.slots.flatMap(slot => slot.maps.map(map => archiveThreads(map)));
    await Promise.all([...customMaps, ...jobPosts, ...threadArchiving]);

    const slots = mappool.slots.map(slot => slot.remove());
    await Promise.all(slots);

    await deletePack("mappacksTemp", mappool);
    await mappool.remove();

    await Promise.all([
        respond(m, `**${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})** has been deleted`),
        mappoolLog(tournament, "delete", user, `\`${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})\` has been deleted`),
    ]);
    return;
}

async function unlinkMap (map: MappoolMap) {
    map.customBeatmap = map.jobPost = null;
    map.history = [];
    return map.save();
}

async function archiveThreads (map: MappoolMap) {
    if (map.customThreadID) {
        const ch = await discordClient.channels.fetch(map.customThreadID) as ThreadChannel | null;
        if (ch)
            await ch.setArchived(true);
    }

    if (map.jobPost?.jobBoardThread) {
        const ch = await discordClient.channels.fetch(map.jobPost.jobBoardThread) as ThreadChannel | null;
        if (ch) {
            const forum = ch.parent as ForumChannel;
            await ch.setAppliedTags([ forum.availableTags.find(tag => tag.name.toLowerCase() === "closed")?.id || "" ]);
            await ch.setArchived(true);
        }
    }
}

async function deleteHistory (IDs: number[]) {
    const history = await MappoolMapHistory
        .createQueryBuilder("history")
        .where("history.ID IN (:...IDs)", { IDs })
        .getMany();

    return Promise.all(history.map(h => h.remove()));
}

const data = new SlashCommandBuilder()
    .setName("mappool_delete")
    .setDescription("Delete a slot, map, or a pool.")
    .addStringOption(option => 
        option.setName("pool")
            .setDescription("The pool to delete (from).")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot or map to delete. If not specified, the pool will be deleted.")
            .setRequired(false))
    .setDMPermission(false);

interface parameters {
    pool: string,
    slot?: string,
    order?: number,
}

const mappoolDelete: Command = {
    data,
    alternativeNames: [ "delete_mappool", "mappool-delete", "delete-mappool", "mappooldelete", "deletemappool", "deletep", "pdelete", "pool_delete", "delete_pool", "pool-delete", "delete-pool", "pooldelete", "deletepool", "mappool_del", "del_mappool", "mappool-del", "del-mappool", "mappooldel", "delmappool", "delp", "pdel", "pool_del", "del_pool", "pool-del", "del-pool", "pooldel", "delpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolDelete;