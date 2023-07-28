import { ChatInputCommandInteraction, Message, SlashCommandBuilder, ThreadChannel } from "discord.js";
import { Command } from "../../index";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import getUser from "../../../../Server/functions/get/getUser";
import commandUser from "../../../functions/commandUser";
import { loginResponse } from "../../../functions/loginResponse";
import { extractParameters } from "../../../functions/parameterFunctions";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import { unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import channelID from "../../../functions/channelID";
import deleteMappoolMap from "../../../../Server/functions/delete/deleteMappoolMap";
import deleteMappoolSlot from "../../../../Server/functions/delete/deleteMappoolSlot";
import deleteMappool from "../../../../Server/functions/delete/deleteMappool";
import confirmCommand from "../../../functions/confirmCommand";
import respond from "../../../functions/respond";
import mappoolLog from "../../../functions/tournamentFunctions/mappoolLog";
import getCustomThread from "../../../functions/tournamentFunctions/getCustomThread";
import { discordClient } from "../../../../Server/discord";
import { TournamentRoleType } from "../../../../Interfaces/tournament";

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
        { name: "pool", paramType: "string" },
        { name: "slot", paramType: "string", postProcess: postProcessSlotOrder, optional: true },
    ]);
    if (!params)
        return;

    const { pool, slot, order } = params;

    const components = await mappoolComponents(m, pool, slot || true, order || true, true, { text: channelID(m), searchType: "channel" }, unFinishedTournaments, undefined, undefined, true);
    if (!components || !("mappool" in components))
        return;

    const { tournament, mappool } = components;

    if ("mappoolMap" in components && components.slotMod.maps.length > 1) {
        if (!await confirmCommand(m, `U sure u wanna delete **${components.mappoolSlot}**?\n${components.mappoolMap.customBeatmap ? "This will also delete the custom beatmap and all currently saved previous versions in the database" : ""}\n${components.mappoolMap.jobPost ? "This will also delete the job post" : ""}`)) {
            await respond(m, "Ok w/e .");
            return;
        }

        await deleteMappoolMap(mappool, components.mappoolMap);

        const { slotMod } = components;
        if (order && slotMod.maps.length !== order) {
            slotMod.maps = slotMod.maps.filter(map => map.ID !== components.mappoolMap.ID);
            slotMod.maps.sort((a, b) => a.order - b.order);
            slotMod.maps.forEach(async (map, index) => {
                map.order = index + 1;
                await map.save();

                if (map.customThreadID)
                    await getCustomThread(m, map, tournament, `${mappool.abbreviation.toUpperCase()} ${slot}${slotMod.maps.length === 1 ? "" : map.order}`);
                if (map.jobPost?.jobBoardThread) {
                    const ch = await discordClient.channels.fetch(map.jobPost.jobBoardThread) as ThreadChannel | null;
                    if (ch)
                        await ch.setName(`${mappool.abbreviation.toUpperCase()} ${slot}${slotMod.maps.length === 1 ? "" : map.order}`);
                }
            });
        }
        
        await Promise.all([
            respond(m, `**${components.mappoolSlot}** has been deleted ${components.mappoolMap.customBeatmap || components.mappoolMap.jobPost ? "along with the custom beatmap and/or job posts" : ""}`),
            mappoolLog(tournament, "deleteMappoolMap", user, `\`${components.mappoolSlot}\` has been deleted ${components.mappoolMap.customBeatmap || components.mappoolMap.jobPost ? "along with the custom beatmap and/or job posts" : ""}`),
        ]);
        return;
    }

    if ("slotMod" in components) {
        if (!await confirmCommand(m, `U sure u wanna delete **${components.slotMod.name} (${components.slotMod.acronym})** and all of the maps connected to it?\nIt'll also delete any custom beatmaps and all currently saved previous versions of such custom beatmaps in the database, AND/OR job posts attached to any of the map slots in this slot`)) {
            await respond(m, "Ok w/e .");
            return;
        }
        await deleteMappoolSlot(mappool, components.slotMod);

        await Promise.all([  
            respond(m, `**${components.slotMod.name.toUpperCase()} (${components.slotMod.acronym.toUpperCase()})** in **${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})** has been deleted`),
            mappoolLog(tournament, "deleteMappoolSlot", user, `\`${components.slotMod.name.toUpperCase()} (${components.slotMod.acronym.toUpperCase()})\` in \`${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})\` has been deleted`),
        ]);
        return;
    }

    if (!await confirmCommand(m, `U sure u wanna delete **${mappool.name} (${mappool.abbreviation})** and all of the maps connected to it?\nIt'll also delete any custom beatmaps and all currently saved previous versions of such custom beatmaps in the database, AND/OR job posts attached to any of the map slots in this pool`)) {
        await respond(m, "Ok w/e .");
        return;
    }
    await deleteMappool(mappool);
    await Promise.all([
        respond(m, `**${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})** has been deleted`),
        mappoolLog(tournament, "deleteMappool", user, `\`${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})\` has been deleted`),
    ]);
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