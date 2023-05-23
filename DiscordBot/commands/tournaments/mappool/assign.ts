import { ChatInputCommandInteraction, ForumChannel, Message, SlashCommandBuilder, ThreadChannel } from "discord.js";
import { Command } from "../../index";
import { Tournament, TournamentStatus, unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { Beatmap } from "../../../../Models/beatmap";
import { Beatmap as APIBeatmap, Mode } from "nodesu";
import { osuClient } from "../../../../Server/osu";
import { insertBeatmap } from "../../../../Server/scripts/fetchYearMaps";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { loginResponse } from "../../../functions/loginResponse";
import { MappoolMapHistory } from "../../../../Models/tournaments/mappools/mappoolMapHistory";
import { discordClient } from "../../../../Server/discord";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { deletePack } from "../../../functions/tournamentFunctions/mappackFunctions";
import { extractParameters } from "../../../functions/parameterFunctions"
import { extractTargetText } from "../../../functions/tournamentFunctions/paramaterExtractionFunctions";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { User } from "../../../../Models/user";
import { JobPost } from "../../../../Models/tournaments/mappools/jobPost";
import beatmapEmbed from "../../../functions/beatmapEmbed";
import respond from "../../../functions/respond";
import getUser from "../../../functions/dbFunctions/getUser";
import commandUser from "../../../functions/commandUser";
import mappoolLog from "../../../functions/tournamentFunctions/mappoolLog";
import confirmCommand from "../../../functions/confirmCommand";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import getStaff from "../../../functions/tournamentFunctions/getStaff";
import getCustomThread from "../../../functions/tournamentFunctions/getCustomThread";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const check = await securityChecks(m, true, false, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers, TournamentChannelType.Jobboard], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]);
    if (!check)
        return;
    
    const testing = (m instanceof ChatInputCommandInteraction ? m.options.getBoolean("testing") : /-test Y/i.test(m.content));
    if (testing && m instanceof Message) 
        m.content = m.content.replace(/-test Y/i, "");

    const replace = (m instanceof ChatInputCommandInteraction ? m.options.getBoolean("replace") : /-r Y/i.test(m.content));
    if (replace && m instanceof Message) {
        const confirm = await confirmCommand(m, `Toggling \`replace\` will replace all ${testing ? "tesplayers" : "custom mappers"} in the slot. Are you sure you want to continue?`);
        if (!confirm)
            return;
        m.content = m.content.replace(/-r Y/i, "");
    }

    const params = extractParameters<parameters>(m, [
        { name: "pool", regex: /-p (\S+)/, regexIndex: 1 },
        { name: "slot", regex: /-s (\S+)/, regexIndex: 1, postProcess: postProcessSlotOrder },
        { name: "target", customHandler: extractTargetText(3)  },
    ]); 
    if (!params)
        return;

    const { target, pool, slot, order } = params;

    const components = await mappoolComponents(m, pool, slot, order, true, { text: m.channelId, searchType: "channel" }, unFinishedTournaments, false, undefined, true);
    if (!components || !("mappoolMap" in components))
        return;
    const { tournament, mappool, slotMod, mappoolMap, mappoolSlot } = components;

    const assigner = await getUser(commandUser(m).id, "discord", false);
    if (!assigner) {
        await loginResponse(m);
        return;
    }
    mappoolMap.assignedBy = assigner;

    const jobPost = mappoolMap.jobPost;
    if (jobPost?.jobBoardThread) {
        const thread = await discordClient.channels.fetch(jobPost.jobBoardThread) as ThreadChannel | null;
        if (thread) {
            const tag = (thread.parent as ForumChannel).availableTags.find(t => t.name.toLowerCase() === "closed")?.id;
            if (tag) await thread.setAppliedTags([tag], "This slot is now assigned.");
            await thread.setArchived(true, "This slot is now assigned.");
        }
    }
    mappoolMap.jobPost = null;

    // Check if target is link
    if ((m instanceof ChatInputCommandInteraction && m.options.getSubcommand() === "beatmap") || target.includes("osu.ppy.sh/beatmaps")) {
        await handleBeatmapLink(m, target, slotMod.allowedMods, tournament, mappool, mappoolSlot, mappoolMap, slot, assigner, jobPost);
        return;
    }
    
    await handleUser(m, target, testing, replace, tournament, mappool, mappoolSlot, mappoolMap, assigner, jobPost);
}

async function handleBeatmapLink(m: Message | ChatInputCommandInteraction, target: string, allowedMods: number | undefined, tournament: Tournament, mappool: Mappool, mappoolSlot: string, mappoolMap: MappoolMap, mod: string, assigner: User, jobPost?: JobPost | null) {
    const linkRegex = /https?:\/\/osu.ppy.sh\/beatmapsets\/(\d+)#(osu|taiko|fruits|mania)\/(\d+)/;
    const link = target.match(linkRegex);
    if (!link) {
        await respond(m, "Invalid link. Please use a valid osu! beatmap link that contains the set id and beatmap id (e.g. https://osu.ppy.sh/beatmapsets/1234567#osu/1234567).");
        return;
    }
    const beatmapID = parseInt(link[3]);
    
    const set = (await osuClient.beatmaps.getBySetId(parseInt(link[1]), Mode.all, undefined, undefined, allowedMods) as APIBeatmap[]);
    const apiMap = set.find(m => m.beatmapId === beatmapID)
    if (!apiMap) {
        await respond(m, "Could not find beatmap on osu!api.");
        return;
    }
    if (apiMap.mode !== tournament.mode.ID - 1) {
        await respond(m, "Beatmap mode does not match tournament mode.");
        return;
    }
    // TODO: Support for maps with no approved date (e.g. graveyarded maps) https://github.com/Corsace/Corsace/issues/193
    if (isNaN(apiMap.approvedDate.getTime())) {
        await respond(m, "Beatmap is not ranked. Support will be added soon!\nhttps://github.com/Corsace/Corsace/issues/193");
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
        .getExists()){
            await respond(m, `The beatmap you are trying to add is already in **${tournament.name}**.`);
            return;
    }

    if (mappoolMap.beatmap && mappoolMap.beatmap.ID === beatmap.ID) {
        await respond(m, `**${mappoolSlot}** is already set to this beatmap.`);
        return;
    }

    mappoolMap.beatmap = beatmap;
    mappoolMap.isCustom = false;
    mappoolMap.deadline = null;
    mappoolMap.customMappers = [];

    const customMap = mappoolMap.customBeatmap;
    if (mappoolMap.customBeatmap)
        mappoolMap.customBeatmap = null;
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
    if (jobPost) await jobPost.remove();

    await deletePack("mappacksTemp", mappool);
    mappool.mappackLink = mappool.mappackExpiry = null;
    await mappool.save();

    const log = new MappoolMapHistory();
    log.createdBy = assigner;
    log.mappoolMap = mappoolMap;
    log.beatmap = beatmap;
    await log.save();

    const mappoolMapEmbed = await beatmapEmbed(apiMap, mod, set);
    mappoolMapEmbed.data.author!.name = `${mappoolSlot}: ${mappoolMapEmbed.data.author!.name}`;

    await respond(m, `Successfully set **${mappoolSlot}** to **${beatmap.beatmapset.artist} - ${beatmap.beatmapset.title} [${beatmap.difficulty}]**`, [mappoolMapEmbed]);

    await mappoolLog(tournament, "assignMap", assigner, log, mappoolSlot);
    return;
}

async function handleUser (m: Message | ChatInputCommandInteraction, target: string, testing: boolean | null, replace: boolean | null, tournament: Tournament, mappool: Mappool, mappoolSlot: string, mappoolMap: MappoolMap, assigner: User, jobPost?: JobPost | null) {
    // Check if user has any mapper/tester roles
    const user = await getStaff(m, tournament, target, [testing ? TournamentRoleType.Testplayers : TournamentRoleType.Mappers, TournamentRoleType.Mappoolers, TournamentRoleType.Organizer]);
    if (!user) 
        return;
    
    if (testing) {
        if (mappoolMap.testplayers.find(u => u.ID === user.ID)) {
            await respond(m, `**${user.osu.username}** is already assigned as a testplayer to **${mappoolSlot}**`);
            return;
        }

        if (replace)
            mappoolMap.testplayers = [user];
        else
            mappoolMap.testplayers.push(user);
    } else {
        if (mappoolMap.customMappers.find(u => u.ID === user.ID)) {
            await respond(m, `**${user.osu.username}** is already assigned as a custom mapper to **${mappoolSlot}**`);
            return;
        }

        mappoolMap.beatmap = null;
        mappoolMap.isCustom = true;
        if (replace)
            mappoolMap.customMappers = [user];
        else
            mappoolMap.customMappers.push(user);

        await deletePack("mappacksTemp", mappool);
        mappool.mappackLink = mappool.mappackExpiry = null;
        await mappool.save();
    }

    const customThread = await getCustomThread(m, mappoolMap, tournament, mappoolSlot);
    if (!customThread)
        return;
    if (customThread !== true && m.channel?.id !== customThread[0].id) {
        const [thread, threadMsg] = customThread;
        mappoolMap.customThreadID = thread.id;
        mappoolMap.customMessageID = threadMsg.id;
        await thread.send(`<@${user.discord.userID}> has been added as a ${testing ? "testplayer" : "custom mapper"}`);
    }

    await mappoolMap.save();
    if (jobPost) await jobPost.remove();

    await respond(m, `Successfully added **${user.osu.username}** as a **${testing ? "testplayer" : "custom mapper"}** for **${mappoolSlot}**${replace ? ` (replacing all existing ${testing ? "testplayers" : "mappers"})` : ""}`);

    await mappoolLog(tournament, "assignCustomMapper", assigner, `\`${user.osu.username}\` is now a \`${testing ? "testplayer" : "custom mapper"}\` for \`${mappoolSlot}\`${replace ? ` (replacing all existing ${testing ? "testplayers" : "mappers"})` : ""}`);
}

const data = new SlashCommandBuilder()
    .setName("mappool_assign")
    .setDescription("Assign a beatmap or mapper to a mappool slot.")
    .addSubcommand(subcommand =>
        subcommand.setName("custom")
            .setDescription("Assign a custom beatmap to a mappool slot.")
            .addStringOption(option =>
                option.setName("pool")
                    .setDescription("The mappool to assign to.")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("slot")
                    .setDescription("The slot to assign to.")
                    .setRequired(true))
            .addUserOption(option =>
                option.setName("user")
                    .setDescription("The user to assign.")
                    .setRequired(true))
            .addBooleanOption(option =>
                option.setName("replace")
                    .setDescription("Whether to replace the existing mapper(s), or to add on.")
                    .setRequired(false))
            .addBooleanOption(option =>
                option.setName("testing")
                    .setDescription("Whether to assign as a tester instead of a mapper.")
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand.setName("beatmap")
            .setDescription("Assign an already existing beatmap to a mappool slot.")
            .addStringOption(option =>
                option.setName("pool")
                    .setDescription("The mappool to assign to.")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("slot")
                    .setDescription("The slot to assign to.")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("link")
                    .setDescription("The beatmap link to assign.")
                    .setRequired(true)))
    .setDMPermission(false);

interface parameters {
    target: string,
    pool: string,
    slot: string,
    order: number,
}

const mappoolAssign: Command = {
    data,
    alternativeNames: [ "assign_mappool", "mappool-assign", "assign-mappool", "mappoolassign", "assignmappool", "assignp", "passign", "pool_assign", "assign_pool", "pool-assign", "assign-pool", "poolassign", "assignpool", "mappool_a", "a_mappool", "mappool-a", "a-mappool", "mappoola", "amappool", "ap", "pa", "pool_a", "a_pool", "pool-a", "a-pool", "poola", "apool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolAssign;