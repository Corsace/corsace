import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Message, MessageComponentInteraction, SlashCommandBuilder, ThreadChannel } from "discord.js";
import { Command } from "../../index";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { MappoolMapHistory } from "../../../../Models/tournaments/mappools/mappoolMapHistory";
import { loginResponse } from "../../../functions/loginResponse";
import { discordClient } from "../../../../Server/discord";
import { deletePack } from "../../../functions/tournamentFunctions/mappackFunctions";
import { randomUUID } from "crypto";
import getUser from "../../../functions/dbFunctions/getUser";
import commandUser from "../../../functions/commandUser";
import respond from "../../../functions/respond";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import { Tournament, unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import getMappool from "../../../functions/tournamentFunctions/getMappool";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import getMappoolSlot from "../../../functions/tournamentFunctions/getMappoolSlot";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import getCustomThread from "../../../functions/tournamentFunctions/getCustomThread";
import mappoolLog from "../../../functions/tournamentFunctions/mappoolLog";
import { User } from "../../../../Models/user";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import channelID from "../../../functions/channelID";

async function getMappools (m: Message | ChatInputCommandInteraction, tournament: Tournament, pool1: string, pool2: string | null): Promise<[Mappool, Mappool] | undefined> {
    const mappool1 = await getMappool(m, tournament, pool1);
    if (!mappool1) 
        return;
    if (mappool1.isPublic) {
        await respond(m, `Mappool **${mappool1.name}** is public mate u can't use the command. Make the mappool private first`);
        return;
    }
    const mappool2 = !pool2 ? mappool1 : await getMappool(m, tournament, pool2);
    if (!mappool2) 
        return;
    if (mappool2.isPublic) {
        await respond(m, `Mappool **${mappool2.name}** is public mate u can't use the command. Make the mappool private first`);
        return;
    }

    return [mappool1, mappool2];
}

async function getMaps (m: Message | ChatInputCommandInteraction, mappool1: Mappool, mappool2: Mappool, slot1: string, slot2: string, order1: number | true, order2: number | true): Promise<[MappoolMap, MappoolMap, MappoolSlot, MappoolSlot] | undefined> {
    const slotMod1 = await getMappoolSlot(m, mappool1, slot1, true, true, true);
    if (!slotMod1) 
        return;

    const slotMod2 = await getMappoolSlot(m, mappool2, slot2, true, true, true);
    if (!slotMod2) 
        return;

    const mappoolMap1 = order1 === true ? slotMod1.maps.length === 1 ? slotMod1.maps[0] : undefined : slotMod1.maps.find(m => m.order === order1);
    if (!mappoolMap1) {
        await respond(m, `Can't find **${slot1}${order1 === true ? "" : order1}**`);
        return;
    }
    const mappoolMap2 = order2 === true ? slotMod2.maps.length === 1 ? slotMod2.maps[0] : undefined : slotMod2.maps.find(m => m.order === order2);
    if (!mappoolMap2) {
        await respond(m, `Can't find **${slot2}${order2 === true ? "" : order2}**`);
        return;
    }

    return [mappoolMap1, mappoolMap2, slotMod1, slotMod2];
}

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

    const pool1Text = m instanceof Message ? m.content.split(" ")[1] : m.options.getString("pool1");
    const slot1Text = m instanceof Message ? m.content.split(" ")[2] : m.options.getString("slot1");
    const slot2Text = m instanceof Message ? m.content.split(" ")[3] : m.options.getString("slot2");
    const pool2Text = m instanceof Message ? m.content.split(" ")[4] : m.options.getString("pool2");
    if (!pool1Text || !slot1Text || !slot2Text) {
        await respond(m, "Ur missing parameters, use `<pool1> <slot1> <slot2> [pool2]`");
        return;
    }

    const pool1 = pool1Text;
    let order1: number | true = parseInt(slot1Text.substring(slot1Text.length - 1));
    let slot1 = (slot1Text.substring(0, slot1Text.length - 1)).toUpperCase();
    let order2: number | true = parseInt(slot2Text.substring(slot2Text.length - 1));
    let slot2 = (slot2Text.substring(0, slot2Text.length - 1)).toUpperCase();
    if (isNaN(order1)) {
        order1 = true;
        slot1 = slot1Text.toUpperCase();
    }
    if (isNaN(order2)) {
        order2 = true;
        slot2 = slot2Text.toUpperCase();
    }

    const order1Text = `${order1 === true ? "" : order1}`;
    const order2Text = `${order2 === true ? "" : order2}`;

    const pool2 = pool2Text || pool1Text;

    const tournament = await getTournament(m, channelID(m), "channel", unFinishedTournaments);
    if (!tournament) 
        return;

    const mappools = await getMappools(m, tournament, pool1, pool2);
    if (!mappools)
        return;

    const [mappool1, mappool2] = mappools;

    const maps = await getMaps(m, mappool1, mappool2, slot1, slot2, order1, order2);
    if (!maps)
        return;

    let [mappoolMap1, mappoolMap2] = maps;
    
    const mappoolSlot1 = `${mappool1.abbreviation.toUpperCase()} ${slot1}${order1Text}`;
    const mappoolSlot2 = `${mappool2.abbreviation.toUpperCase()} ${slot2}${order2Text}`;

    // Confirm swap before swapping
    const name1 = mappoolMap1.beatmap ? `${mappoolMap1.beatmap.beatmapset.artist} - ${mappoolMap1.beatmap.beatmapset.title} [${mappoolMap1.beatmap.difficulty}]` : mappoolMap1.customBeatmap ? `${mappoolMap1.customBeatmap.artist} - ${mappoolMap1.customBeatmap.title} [${mappoolMap1.customBeatmap.difficulty}]` : "Nothing";
    const name2 = mappoolMap2.beatmap ? `${mappoolMap2.beatmap.beatmapset.artist} - ${mappoolMap2.beatmap.beatmapset.title} [${mappoolMap2.beatmap.difficulty}]` : mappoolMap2.customBeatmap ? `${mappoolMap2.customBeatmap.artist} - ${mappoolMap2.customBeatmap.title} [${mappoolMap2.customBeatmap.difficulty}]` : "Nothing";
    const ids = {
        yes: randomUUID(),
        no: randomUUID(),
    };
    const confirm = await m.channel!.send({
        content: `Are u sure u wanna swap **${slot1}${order1Text}** (${name1}) with **${slot2}${order2Text}** (${name2})?`,
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(ids.yes)
                        .setLabel("YES")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(ids.no)
                        .setLabel("NO")
                        .setStyle(ButtonStyle.Danger)
                ),
        ],
    });

    const filter = (i: MessageComponentInteraction) => i.user.id === commandUser(m).id;
    const collector = confirm.createMessageComponentCollector({ filter, time: 6000000 });

    const stop = await new Promise<boolean>((resolve) => {
        let done = false;
        collector.on("collect", async i => {
            if (i.customId === ids.yes) {
                done = true;
                await i.reply("Swapping...");
                setTimeout(async () => (await i.deleteReply()), 100);
                collector.stop();
                await confirm.delete();
                return resolve(false);
            } else if (i.customId === ids.no) {
                done = true;
                await i.reply("Ok");
                setTimeout(async () => (await i.deleteReply()), 5000);
                collector.stop();
                await confirm.delete();
                return resolve(true);
            }
        });
        collector.on("end", async () => {
            if (!done) {
                await confirm.delete();
                return resolve(true);
            }
        });
    });
    if (stop) 
        return;

    let log1: MappoolMapHistory | undefined = new MappoolMapHistory();
    let log2: MappoolMapHistory | undefined = new MappoolMapHistory();

    log1.createdBy = log2.createdBy = user;

    const swappedMaps = await swap(mappoolMap1, mappoolMap2, log1, log2, user);
    if (!swappedMaps)
        return;

    ({ mappoolMap1, mappoolMap2, log1, log2 } = swappedMaps);

    await saveSwap(mappool1, mappool2, mappoolMap1, mappoolMap2, log1, log2);

    await updateThreads(m, tournament, mappoolMap1, mappoolMap2, mappoolSlot1, mappoolSlot2);

    await respond(m, `Swapped **${slot1}${order1Text}** with **${slot2}${order2Text}**\n\nAffected threads:\nCustom Threads: ${mappoolMap1.customThreadID ? `<#${mappoolMap1.customThreadID}>` : "N/A"} ${mappoolMap2.customThreadID ? `<#${mappoolMap2.customThreadID}>` : "None"}\nJob Boards: ${mappoolMap1.jobPost?.jobBoardThread ? `<#${mappoolMap1.jobPost.jobBoardThread}>` : "None"} ${mappoolMap2.jobPost?.jobBoardThread ? `<#${mappoolMap2.jobPost.jobBoardThread}>` : "N/A"}`);

    await mappoolLog(tournament, "swap", user, `Swapped \`${slot1}${order1Text}\` with \`${slot2}${order2Text}\`\n${log2 ? `\`${slot1}${order1Text}\` is now ${log2.beatmap ? `\`${log2.beatmap.beatmapset.artist} - ${log2.beatmap.beatmapset.title} [${log2.beatmap.difficulty}]\`` : `\`${log2.artist} - ${log2.title} [${log2.difficulty}]`}\`` : `\`${slot1}${order1Text}\` is now empty`}\n${log1 ? `\`${slot2}${order2Text}\` is now ${log1.beatmap ? `\`${log1.beatmap.beatmapset.artist} - ${log1.beatmap.beatmapset.title} [${log1.beatmap.difficulty}]\`` : `\`${log1.artist} - ${log1.title} [${log1.difficulty}]`}\`` : `\`${slot2}${order2Text}\` is now empty`}`);
}

async function swap (mappoolMap1: MappoolMap, mappoolMap2: MappoolMap, log1: MappoolMapHistory | undefined, log2: MappoolMapHistory | undefined, swapper: User) {
    const {
        isCustom: isCustom1,
        deadline: deadline1 = null,
        customThreadID: customThread1 = null,
        customMessageID: customMessage1 = null,
        testplayers: testplayers1 = [],
        customMappers: customMappers1 = [],
        jobPost: jobPost1 = null,
        customBeatmap: customBeatmap1 = null,
        beatmap: beatmap1 = null,
    } = mappoolMap1;

    const {
        isCustom: isCustom2,
        deadline: deadline2 = null,
        customThreadID: customThread2 = null,
        customMessageID: customMessage2 = null,
        testplayers: testplayers2 = [],
        customMappers: customMappers2 = [],
        jobPost: jobPost2 = null,
        customBeatmap: customBeatmap2 = null,
        beatmap: beatmap2 = null,
    } = mappoolMap2;

    if (customBeatmap1) {
        mappoolMap1.customBeatmap = null;

        log2 = new MappoolMapHistory();
        log2.createdBy = swapper;
        log2.mappoolMap = mappoolMap2;
        log2.artist = customBeatmap1.artist;
        log2.title = customBeatmap1.title;
        log2.difficulty = customBeatmap1.difficulty;
        log2.link = customBeatmap1.link;
    } else if (beatmap1) {
        log2 = new MappoolMapHistory();
        log2.createdBy = swapper;
        log2.mappoolMap = mappoolMap2;
        log2.beatmap = beatmap1;
    } else {
        if (jobPost1) 
            mappoolMap1.jobPost = null;

        log2 = undefined;
    }
    await mappoolMap1.save();

    if (customBeatmap2) {
        mappoolMap2.customBeatmap = null;
    
        log1 = new MappoolMapHistory();
        log1.createdBy = swapper;
        log1.mappoolMap = mappoolMap1;
        log1.artist = customBeatmap2.artist;
        log1.title = customBeatmap2.title;
        log1.difficulty = customBeatmap2.difficulty;
        log1.link = customBeatmap2.link;
    } else if (beatmap2) {
        log1 = new MappoolMapHistory();
        log1.createdBy = swapper;
        log1.mappoolMap = mappoolMap1;
        log1.beatmap = beatmap2;
    } else {
        if (jobPost2) 
            mappoolMap2.jobPost = null;

        log1 = undefined;
    }
    await mappoolMap2.save();

    [mappoolMap1.isCustom, mappoolMap1.deadline, mappoolMap1.customThreadID, mappoolMap1.customMessageID, mappoolMap1.testplayers, mappoolMap1.customMappers, mappoolMap1.jobPost, mappoolMap1.customBeatmap, mappoolMap1.beatmap] = [isCustom2, deadline2, customThread2, customMessage2, testplayers2, customMappers2, jobPost2, customBeatmap2, beatmap2];

    [mappoolMap2.isCustom, mappoolMap2.deadline, mappoolMap2.customThreadID, mappoolMap2.customMessageID, mappoolMap2.testplayers, mappoolMap2.customMappers, mappoolMap2.jobPost, mappoolMap2.customBeatmap, mappoolMap2.beatmap] = [isCustom1, deadline1, customThread1, customMessage1, testplayers1, customMappers1, jobPost1, customBeatmap1, beatmap1];

    return { mappoolMap1, mappoolMap2, log1, log2 };
}

async function saveSwap (mappool1: Mappool, mappool2: Mappool, mappoolMap1: MappoolMap, mappoolMap2: MappoolMap, log1: MappoolMapHistory | undefined, log2: MappoolMapHistory | undefined) {
    await mappoolMap1.save();
    await mappoolMap2.save();

    if (log1) await log1.save();
    if (log2) await log2.save();

    await deletePack("mappacksTemp", mappool1);
    await deletePack("mappacksTemp", mappool2);
}

async function updateThreads (m: Message | ChatInputCommandInteraction, tournament: Tournament, mappoolMap1: MappoolMap, mappoolMap2: MappoolMap, mappoolSlot1: string, mappoolSlot2: string) {
    let [customThread1, customThread2]: [[ThreadChannel, Message] | boolean | undefined, [ThreadChannel, Message] | boolean | undefined] = [undefined, undefined];
    if (mappoolMap1.customThreadID)
        customThread1 = await getCustomThread(m, mappoolMap1, tournament, mappoolSlot1);
    if (mappoolMap1.jobPost?.jobBoardThread) {
        const thread = await discordClient.channels.fetch(mappoolMap1.jobPost.jobBoardThread) as ThreadChannel | null;
        if (thread) await thread.setName(mappoolSlot1);
    }

    if (mappoolMap2.customThreadID)
        customThread2 = await getCustomThread(m, mappoolMap2, tournament, mappoolSlot2);
    if (mappoolMap2.jobPost?.jobBoardThread) {
        const thread = await discordClient.channels.fetch(mappoolMap2.jobPost.jobBoardThread) as ThreadChannel | null;
        if (thread) await thread.setName(mappoolSlot2);
    }

    const thread1 = customThread1 === true ? null : customThread1 ? customThread1[0] : null;
    const thread2 = customThread2 === true ? null : customThread2 ? customThread2[0] : null;

    await Promise.all([
        thread1?.send(`This slot is swapped with ${mappoolSlot2} by <@${commandUser(m).id}>.`),
        thread2?.send(`This slot is swapped with ${mappoolSlot1} by <@${commandUser(m).id}>.`),
    ]);
}

const data = new SlashCommandBuilder()
    .setName("mappool_swap")
    .setDescription("Swap 2 slots in a mappool or between mappools.")
    .addStringOption(option =>
        option.setName("pool1")
            .setDescription("The mappool to swap in.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("slot1")
            .setDescription("The first slot to swap.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("slot2")
            .setDescription("The second slot to swap.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("pool2")
            .setDescription("The mappool to swap with. (Do not need this if it is within the same pool)")
            .setRequired(false))
    .setDMPermission(false);

const mappoolSwap: Command = {
    data,
    alternativeNames: [ "swap_mappool", "mappool-swap", "swap-mappool", "mappoolswap", "swapmappool", "swapp", "pswap", "pool_swap", "swap_pool", "pool-swap", "swap-pool", "poolswap", "swappool", "mappool_sw", "sw_mappool", "mappool-sw", "sw-mappool", "mappoolsw", "swmappool", "swp", "psw", "pool_sw", "sw_pool", "pool-sw", "sw-pool", "poolsw", "swpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolSwap;