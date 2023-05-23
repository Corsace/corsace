import { ChatInputCommandInteraction, Message, SlashCommandBuilder, ThreadChannel } from "discord.js";
import { Command } from "../../index";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { loginResponse } from "../../../functions/loginResponse";
import { CustomBeatmap } from "../../../../Models/tournaments/mappools/customBeatmap";
import { discordClient } from "../../../../Server/discord";
import { deletePack } from "../../../functions/tournamentFunctions/mappackFunctions";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { extractParameters } from "../../../functions/parameterFunctions";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import { extractTargetText } from "../../../functions/tournamentFunctions/paramaterExtractionFunctions";
import { Tournament, unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { User } from "../../../../Models/user";
import getUser from "../../../functions/dbFunctions/getUser";
import commandUser from "../../../functions/commandUser";
import respond from "../../../functions/respond";
import mappoolLog from "../../../functions/tournamentFunctions/mappoolLog";
import getCustomThread from "../../../functions/tournamentFunctions/getCustomThread";
import confirmCommand from "../../../functions/confirmCommand";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, false, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers, TournamentChannelType.Jobboard], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]))
        return;

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const testing = (m instanceof ChatInputCommandInteraction ? m.options.getBoolean("tester") : /-test Y/i.test(m.content));
    if (testing && m instanceof Message)    
        m.content = m.content.replace(/-test Y/i, "");

    const params = extractParameters<parameters>(m, [
        { name: "pool", regex: /-p (\S+)/, regexIndex: 1 },
        { name: "slot", regex: /-s (\S+)/, regexIndex: 1, postProcess: postProcessSlotOrder, optional: true },
        { name: "target", customHandler: extractTargetText(3), optional: true  },
    ]);
    if (!params)
        return;

    const { pool, slot, order, target } = params;

    const components = await mappoolComponents(m, pool, slot || true, order || true, true, { text: m.channelId, searchType: "channel" }, unFinishedTournaments, undefined, target ? { text: target, roles: [TournamentRoleType.Testplayers, TournamentRoleType.Mappers, TournamentRoleType.Mappoolers, TournamentRoleType.Organizer]} : undefined);
    if (!components || !("mappool" in components))
        return;

    const { tournament, mappool } = components;

    if ("mappoolMap" in components) {
        const { mappoolMap, mappoolSlot } = components;
        
        if ((testing && mappoolMap.testplayers.length === 0) || (!mappoolMap.beatmap && mappoolMap.customMappers.length === 0)) {
            await respond(m, `**${mappoolSlot}** is currently empty.`);
            return;
        }

        if (mappoolMap.beatmap) {
            const map = mappoolMap.beatmap;
            mappoolMap.beatmap = null;
            await mappoolMap.save();

            await deletePack("mappacksTemp", mappool);
            mappool.mappackLink = mappool.mappackExpiry = null;
            await mappool.save();

            await respond(m, `Removed **${map.beatmapset.artist} - ${map.beatmapset.title} [${map.difficulty}]** from **${mappoolSlot}**`);
            
            await mappoolLog(tournament, "removeMap", user, `Removed \`${map.beatmapset.artist} - ${map.beatmapset.title} [${map.difficulty}]\` from \`${mappoolSlot}\``)
            return;
        }

        let name = "";
        let customMap: CustomBeatmap | null = null;
        if (mappoolMap.customBeatmap) {
            customMap = mappoolMap.customBeatmap;
            mappoolMap.customBeatmap = null;

            name = `${customMap.artist} - ${customMap.title} [${customMap.difficulty}] `;
        }
    
        if (components.staff) {
            const { staff } = components;

            if (!testing && !mappoolMap.customMappers.some(u => u.ID === staff.ID)) {
                await respond(m, `**${staff.osu.username}** is not a mapper for **${mappoolSlot}**`);
                return;
            }
            if (testing && !mappoolMap.testplayers.some(u => u.ID === staff.ID)) {
                await respond(m, `**${staff.osu.username}** is not a tester for **${mappoolSlot}**`);
                return;
            }

            if (testing) {
                mappoolMap.testplayers = mappoolMap.testplayers.filter(u => u.ID !== staff.ID);

                if (!await notifyCustomThread(m, tournament, mappoolMap, mappoolSlot, `<@${user.discord.userID}> has removed **${staff.osu.username}**`))
                    return;

                await mappoolMap.save();

                await respond(m, `Removed **${staff.osu.username}** from playtesting **${mappoolSlot}**`);

                await mappoolLog(tournament, "removeTester", user, `Removed \`${staff.osu.username}\` from playtesting \`${mappoolSlot}\``)
                return;
            }

            mappoolMap.customMappers = mappoolMap.customMappers.filter(u => u.ID !== staff.ID);

            if (mappoolMap.customMappers.length > 0) {
                

                await mappoolMap.save();

                await respond(m, `Removed **${staff.osu.username}** from **${mappoolSlot}**`);

                await mappoolLog(tournament, "removeCustomMapper", user, `Removed \`${staff.osu.username}\` from \`${mappoolSlot}\``)
                return;
            }
        }

        mappoolMap.testplayers = [];

        if (testing) {
            if (!await notifyCustomThread(m, tournament, mappoolMap, mappoolSlot, `<@${user.discord.userID}> has removed **all testplayers**`))
                return;


            await respond(m, `Removed **all testplayers** from **${mappoolSlot}**`);

            await mappoolLog(tournament, "removeTester", user, `Removed all testplayers from \`${mappoolSlot}\``)
            return;
        }

        mappoolMap.customMappers = [];
        mappoolMap.deadline = null;
        mappoolMap.assignedBy = null;
        if (mappoolMap.customThreadID) {
            const thread = await discordClient.channels.fetch(mappoolMap.customThreadID) as ThreadChannel | null;
            if (thread) {
                await thread.setAppliedTags([], "**All mappers** are removed. The thread is now archived.");
                await thread.setArchived(true, "**All mappers** are removed. The thread is now archived.");
            }
            mappoolMap.customThreadID = null;
            mappoolMap.customMessageID = null;
        }

        await mappoolMap.save();
        if (customMap) await customMap.remove();
        
        await deletePack("mappacksTemp", mappool);
        mappool.mappackLink = mappool.mappackExpiry = null;
        await mappool.save();

        await respond(m, `Removed the custom map ${name !== "" ? "**" + name + "**" : ""}and mappers from **${mappoolSlot}**`);

        await mappoolLog(tournament, "removeCustom", user, `Removed the custom map ${name !== "" ? "\`" + name + "\`" : ""}and mappers from \`${mappoolSlot}\``)
        return;
    }

    const confirm = await confirmCommand(m, "Are you sure you want to remove **ALL** beatmaps, custom beatmaps and mappers from this mappool?\n**This action cannot be undone.**");
    if (!confirm) {
        await respond(m, "Ok Lol");
        return;
    }

    await resetPool(m, tournament, mappool, user, testing);

    await deletePack("mappacksTemp", mappool);
    mappool.mappackLink = mappool.mappackExpiry = null;
    
    await mappool.save();

    await respond(m, `Removed all beatmaps and custom beatmaps + mappers from **${mappool.abbreviation.toUpperCase()}**`);

    await mappoolLog(tournament, "removePool", user, `Removed all beatmaps and custom beatmaps + mappers from \`${mappool.abbreviation.toUpperCase()}\``)
} 

async function resetPool (m: Message | ChatInputCommandInteraction, tournament: Tournament, mappool: Mappool, user: User, testing: boolean | null) {
    mappool.slots.forEach(async slot => {
        slot.maps.forEach(async map => {
            let customMap: CustomBeatmap | null = null;
            if (map.beatmap) {
                map.beatmap = null;
            } else if (map.customBeatmap) {
                customMap = map.customBeatmap;
                map.customBeatmap = null;
            }
            map.testplayers = [];
            if (testing) {
                if (!await notifyCustomThread(m, tournament, map, `${mappool.abbreviation.toUpperCase()} ${slot}${map.order}`, `<@${user.discord.userID}> has removed **all testplayers**`))
                    return;
            } else {
                map.customMappers = [];
                map.deadline = null;
                map.assignedBy = null;
                if (map.customThreadID) {
                    const thread = await discordClient.channels.fetch(map.customThreadID) as ThreadChannel | null;
                    if (thread) {
                        await thread.setAppliedTags([], "**All mappers** are removed. The thread is now archived.");
                        await thread.setArchived(true, "**All mappers** are removed. The thread is now archived.");
                    }
                    map.customThreadID = null;
                    map.customMessageID = null;
                }
            }
            await map.save();
            if (customMap && !testing) await customMap.remove();
        });
    });
}

async function notifyCustomThread(m: Message | ChatInputCommandInteraction, tournament: Tournament, mappoolMap: MappoolMap, mappoolSlot: string, message: string) {
    const customThread = await getCustomThread(m, mappoolMap, tournament, mappoolSlot);
    if (!customThread)
        return;
    if (customThread !== true && m.channel?.id !== customThread[0].id) {
        const [thread] = customThread;
        await thread.send(message);
    }
    return true;
}

const data = new SlashCommandBuilder()
    .setName("mappool_remove")
    .setDescription("Remove a beatmap or custom beatmap + custom mappers from a slot.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to remove the beatmap(s) from")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot to remove the beatmap from. Leave out to remove maps in an entire pool.")
            .setRequired(false))
    .addUserOption(option =>
        option.setName("user")
            .setDescription("The user to remove from the a slot's custom mappers.")
            .setRequired(false))
    .addBooleanOption(option =>
        option.setName("tester")
            .setDescription("Whether the target(s) is/are tester(s).")
            .setRequired(false))

interface parameters {
    pool: string,
    slot?: string,
    order?: number,
    target?: string,
}

const mappoolRemove: Command = {
    data,
    alternativeNames: [ "remove_mappool", "mappool-remove", "remove-mappool", "mappoolremove", "removemappool", "removep", "premove", "pool_remove", "remove_pool", "pool-remove", "remove-pool", "poolremove", "removepool", "mappool_rm", "rm_mappool", "mappool-rm", "rm-mappool", "mappoolrm", "rmmappool", "rmp", "prm", "pool_rm", "rm_pool", "pool-rm", "rm-pool", "poolrm", "rmpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolRemove;