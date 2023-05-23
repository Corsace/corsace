import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, ForumChannel, Message, MessageComponentInteraction, SlashCommandBuilder, ThreadChannel } from "discord.js";
import { Command } from "../../index";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { CustomBeatmap } from "../../../../Models/tournaments/mappools/customBeatmap";
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

    const pool1Regex = /-p1 (\S+)/;
    const slot1Regex = /-s1 (\S+)/;
    const slot2Regex = /-s2 (\S+)/;
    const pool2Regex = /-p2 (\S+)/;
    const pool1Text = m instanceof Message ? m.content.match(pool1Regex) ?? m.content.split(" ")[1] : m.options.getString("pool1");
    const slot1Text = m instanceof Message ? m.content.match(slot1Regex) ?? m.content.split(" ")[2] : m.options.getString("slot1");
    const slot2Text = m instanceof Message ? m.content.match(slot2Regex) ?? m.content.split(" ")[3] : m.options.getString("slot2");
    const pool2Text = m instanceof Message ? m.content.match(pool2Regex) ?? m.content.split(" ")[4] : m.options.getString("pool2");
    if (!pool1Text || !slot1Text || !slot2Text) {
        await respond(m, "Missing parameters. Please use `-p1 <pool> -s1 <slot> -s2 <slot> [-p2 <pool>]` or `<pool1> <slot1> <slot2> [pool2]`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const pool1 = typeof pool1Text === "string" ? pool1Text : pool1Text[0];
    const order1 = parseInt(typeof slot1Text === "string" ? slot1Text.substring(slot1Text.length - 1) : slot1Text[1].substring(slot1Text[1].length - 1));
    const slot1 = (typeof slot1Text === "string" ? slot1Text.substring(0, slot1Text.length - 1) : slot1Text[1].substring(0, slot1Text[1].length - 1)).toUpperCase();
    const order2 = parseInt(typeof slot2Text === "string" ? slot2Text.substring(slot2Text.length - 1) : slot2Text[1].substring(slot2Text[1].length - 1));
    const slot2 = (typeof slot2Text === "string" ? slot2Text.substring(0, slot2Text.length - 1) : slot2Text[1].substring(0, slot2Text[1].length - 1)).toUpperCase();
    if (isNaN(order1) || isNaN(order2)) {
        await respond(m, `Invalid slot order for **${slot1Text}** or **${slot2Text}**, please provide a valid slot.`);
        return;
    }
    const pool2 = !pool2Text ? pool2Text : typeof pool2Text === "string" ? pool2Text : pool2Text[0];

    const tournament = await getTournament(m, m.channelId, "channel", unFinishedTournaments);
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
    
    const mappoolSlot1 = `${mappool1.abbreviation.toUpperCase()} ${slot1}${order1}`;
    const mappoolSlot2 = `${mappool2.abbreviation.toUpperCase()} ${slot2}${order2}`;

    // Confirm swap before swapping
    const name1 = mappoolMap1.beatmap ? `${mappoolMap1.beatmap.beatmapset.artist} - ${mappoolMap1.beatmap.beatmapset.title} [${mappoolMap1.beatmap.difficulty}]` : mappoolMap1.customBeatmap ? `${mappoolMap1.customBeatmap.artist} - ${mappoolMap1.customBeatmap.title} [${mappoolMap1.customBeatmap.difficulty}]` : "Nothing";
    const name2 = mappoolMap2.beatmap ? `${mappoolMap2.beatmap.beatmapset.artist} - ${mappoolMap2.beatmap.beatmapset.title} [${mappoolMap2.beatmap.difficulty}]` : mappoolMap2.customBeatmap ? `${mappoolMap2.customBeatmap.artist} - ${mappoolMap2.customBeatmap.title} [${mappoolMap2.customBeatmap.difficulty}]` : "Nothing";
    const ids = {
        yes: randomUUID(),
        no: randomUUID(),
    }
    const confirm = await m.channel!.send({
        content: `Are you sure you want to swap **${slot1}${order1}** (${name1}) with **${slot2}${order2}** (${name2})?`,
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

    let stop = await new Promise<boolean>((resolve) => {
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

    const beatmap1 = mappoolMap1.beatmap ?? mappoolMap1.customBeatmap;
    const beatmap2 = mappoolMap2.beatmap ?? mappoolMap2.customBeatmap;
    const customMappers1 = mappoolMap1.customMappers;
    const customMappers2 = mappoolMap2.customMappers;
    const testplayers1 = mappoolMap1.testplayers;
    const testplayers2 = mappoolMap2.testplayers;
    const deadline1 = mappoolMap1.deadline;
    const deadline2 = mappoolMap2.deadline;
    let log1: MappoolMapHistory | undefined = new MappoolMapHistory();
    let log2: MappoolMapHistory | undefined = new MappoolMapHistory();
    const jobPost1 = mappoolMap1.jobPost;
    const jobPost2 = mappoolMap2.jobPost;

    log1.createdBy = log2.createdBy = user;

    const swap1 = await swap(m, tournament, mappoolMap1, mappoolMap2, log1, jobPost2, beatmap1, customMappers1, testplayers1, deadline1, mappoolSlot2, user, slot1, order1, name1);
    if (!swap1)
        return;

    ({ log: log1, mappoolMap1, mappoolMap2 } = swap1);

    const swap2 = await swap(m, tournament, mappoolMap2, mappoolMap1, log2, jobPost1, beatmap2, customMappers2, testplayers2, deadline2, mappoolSlot1, user, slot2, order2, name2);
    if (!swap2)
        return;

    ({ log: log2, mappoolMap1, mappoolMap2 } = swap2);

    await saveSwap(m, mappool1, mappool2, mappoolMap1, mappoolMap2, log1, log2, jobPost1, jobPost2, beatmap1, beatmap2);

    await respond(m, `Swapped **${slot1}${order1}** with **${slot2}${order2}**`);

    await mappoolLog(tournament, "swap", user, `Swapped \`${slot1}${order1}\` with \`${slot2}${order2}\`\n${log2 ? `\`${slot1}${order1}\` is now ${log2.beatmap ? `\`${log2.beatmap.beatmapset.artist} - ${log2.beatmap.beatmapset.title} [${log2.beatmap.difficulty}]\`` : `\`${log2.artist} - ${log2.title} [${log2.difficulty}]`}\`` : `\`${slot1}${order1}\` is now empty`}\n${log1 ? `\`${slot2}${order2}\` is now ${log1.beatmap ? `\`${log1.beatmap.beatmapset.artist} - ${log1.beatmap.beatmapset.title} [${log1.beatmap.difficulty}]\`` : `\`${log1.artist} - ${log1.title} [${log1.difficulty}]`}\`` : `\`${slot2}${order2}\` is now empty`}`);
}

async function getMappools (m: Message | ChatInputCommandInteraction, tournament: Tournament, pool1: string, pool2: string | null): Promise<[Mappool, Mappool] | undefined> {
    const mappool1 = await getMappool(m, tournament, pool1);
    if (!mappool1) 
        return;
    if (mappool1.isPublic) {
        await respond(m, `Mappool **${mappool1.name}** is public. You cannot use this command. Please make the mappool private first.`);
        return;
    }
    const mappool2 = !pool2 ? mappool1 : await getMappool(m, tournament, pool2);
    if (!mappool2) 
        return;
    if (mappool2.isPublic) {
        await respond(m, `Mappool **${mappool2.name}** is public. You cannot use this command. Please make the mappool private first.`);
        return;
    }

    return [mappool1, mappool2];
}

async function getMaps (m: Message | ChatInputCommandInteraction, mappool1: Mappool, mappool2: Mappool, slot1: string, slot2: string, order1: number, order2: number): Promise<[MappoolMap, MappoolMap] | undefined> {
    const slotMod1 = await getMappoolSlot(m, mappool1, slot1.toString(), true);
    if (!slotMod1) 
        return;

    const slotMod2 = await getMappoolSlot(m, mappool2, slot2.toString(), true);
    if (!slotMod2) 
        return;

    const mappoolMap1 = slotMod1.maps.find(m => m.order === order1);
    if (!mappoolMap1) {
        await respond(m, `Could not find **${slot1}${order1}**`);
        return;
    }
    const mappoolMap2 = slotMod2.maps.find(m => m.order === order2);
    if (!mappoolMap2) {
        await respond(m, `Could not find **${slot2}${order2}**`);
        return;
    }

    return [mappoolMap1, mappoolMap2];
}

async function swap (m: Message | ChatInputCommandInteraction, tournament: Tournament, mappoolMap1: MappoolMap, mappoolMap2: MappoolMap, log1: MappoolMapHistory, jobPost2: MappoolMap["jobPost"], beatmap1: MappoolMap["beatmap"] | MappoolMap["customBeatmap"], customMappers1: MappoolMap["customMappers"], testplayers1: MappoolMap["testplayers"], deadline1: MappoolMap["deadline"], mappoolSlot2: string, user: User, slot1: string, order1: number, name1: string) {
    let log: MappoolMapHistory | undefined = log1;
    if (beatmap1) {
        if (jobPost2?.jobBoardThread) {
            const thread = await discordClient.channels.fetch(jobPost2.jobBoardThread) as ThreadChannel | null;
            if (thread) {
                const tag = (thread.parent as ForumChannel).availableTags.find(t => t.name.toLowerCase() === "closed")?.id;
                if (tag) await thread.setAppliedTags([tag], "This slot is now assigned.");
                await thread.setArchived(true, "This slot is now assigned.");
            }
        }
        mappoolMap2.jobPost = null;

        if (beatmap1 instanceof CustomBeatmap) {
            mappoolMap2.beatmap = null;
            mappoolMap2.customBeatmap = beatmap1;
            mappoolMap2.isCustom = true;

            log.artist = beatmap1.artist;
            log.title = beatmap1.title;
            log.difficulty = beatmap1.difficulty;
            log.link = beatmap1.link;

            mappoolMap1.customBeatmap = null;
            await mappoolMap1.save();
        } else {
            mappoolMap2.beatmap = beatmap1;
            mappoolMap2.customBeatmap = null;
            mappoolMap2.isCustom = false;

            log.beatmap = beatmap1;
        }

        mappoolMap2.assignedBy = user;
    } else {
        mappoolMap2.beatmap = null;
        mappoolMap2.customBeatmap = null;
        mappoolMap2.isCustom = false;

        log = undefined;
    }

    mappoolMap2.customMappers = customMappers1;
    mappoolMap2.testplayers = testplayers1;
    mappoolMap2.deadline = deadline1 || null;
    if (mappoolMap2.customThreadID && mappoolMap2.customMappers.length === 0) {
        const thread = await discordClient.channels.fetch(mappoolMap2.customThreadID) as ThreadChannel | null;
        if (thread) {
            await thread.setAppliedTags([], "**All mappers** are removed. The thread is now archived.");
            await thread.setArchived(true, "**All mappers** are removed. The thread is now archived.");
        }
        mappoolMap2.customThreadID = null;
        mappoolMap2.customMessageID = null;
    } else if (mappoolMap2.customMappers.length > 0) {
        const customThread = await getCustomThread(m, mappoolMap2, tournament, mappoolSlot2);
        if (!customThread)
            return;
        if (customThread !== true && m.channel?.id !== customThread[0].id) {
            const [thread, threadMsg] = customThread;
            mappoolMap2.customThreadID = thread.id;
            mappoolMap2.customMessageID = threadMsg.id;
            await thread.send(`<@${user.discord.userID}> has swapped this slot with **${slot1}${order1}** (${name1})`);
        }
    }

    return { log, mappoolMap1, mappoolMap2 };
}

async function saveSwap (m: Message | ChatInputCommandInteraction, mappool1: Mappool, mappool2: Mappool, mappoolMap1: MappoolMap, mappoolMap2: MappoolMap, log1: MappoolMapHistory | undefined, log2: MappoolMapHistory | undefined, jobPost1: MappoolMap["jobPost"], jobPost2: MappoolMap["jobPost"], beatmap1: MappoolMap["beatmap"] | MappoolMap["customBeatmap"], beatmap2: MappoolMap["beatmap"] | MappoolMap["customBeatmap"]) {
    await mappoolMap1.save();
    await mappoolMap2.save();

    if (log1) await log1.save()
    if (log2) await log2.save()

    if (jobPost1 && beatmap2) await jobPost1.remove();
    if (jobPost2 && beatmap1) await jobPost2.remove();

    await deletePack("mappacksTemp", mappool1);
    await deletePack("mappacksTemp", mappool2);
    mappool1.mappackLink = mappool1.mappackExpiry = null;
    mappool2.mappackLink = mappool2.mappackExpiry = null;
    await mappool1.save();
    await mappool2.save();
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