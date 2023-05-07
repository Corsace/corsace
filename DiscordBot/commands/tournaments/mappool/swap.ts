import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, ForumChannel, Message, MessageComponentInteraction, SlashCommandBuilder, ThreadChannel } from "discord.js";
import { Command } from "../../index";
import { fetchCustomThread, fetchMappool, fetchSlot, fetchTournament, hasTournamentRoles, isSecuredChannel, mappoolLog } from "../../../functions/tournamentFunctions";
import { TournamentChannel, TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { CustomBeatmap } from "../../../../Models/tournaments/mappools/customBeatmap";
import { MappoolMapHistory } from "../../../../Models/tournaments/mappools/mappoolMapHistory";
import { User } from "../../../../Models/user";
import { loginResponse } from "../../../functions/loginResponse";
import { discordClient } from "../../../../Server/discord";

async function run (m: Message | ChatInputCommandInteraction) {
    if (!m.guild)
        return;

    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const securedChannel = await isSecuredChannel(m, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers]);
    if (!securedChannel) 
        return;

    const tournament = await fetchTournament(m);
    if (!tournament) 
        return;

    const allowed = await hasTournamentRoles(m, tournament, [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]);
    if (!allowed) 
        return;

    const user = await User.findOne({
        where: {
            discord: {
                userID: m instanceof Message ? m.author.id : m.user.id,
            }
        }
    });
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
        if (m instanceof Message) m.reply("Missing parameters. Please use `-p1 <pool> -s1 <slot> -s2 <slot> [-p2 <pool>]` or `<pool1> <slot1> <slot2> [pool2]`. If you do not use the `-` prefixes, the order of the parameters is important.");
        else m.editReply("Missing parameters. Please use `-p1 <pool> -s1 <slot> -s2 <slot> [-p2 <pool>]` or `<pool1> <slot1> <slot2> [pool2]`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const pool1 = typeof pool1Text === "string" ? pool1Text : pool1Text[0];
    const order1 = parseInt(typeof slot1Text === "string" ? slot1Text.substring(slot1Text.length - 1) : slot1Text[1].substring(slot1Text[1].length - 1));
    const slot1 = (typeof slot1Text === "string" ? slot1Text.substring(0, slot1Text.length - 1) : slot1Text[1].substring(0, slot1Text[1].length - 1)).toUpperCase();
    const order2 = parseInt(typeof slot2Text === "string" ? slot2Text.substring(slot2Text.length - 1) : slot2Text[1].substring(slot2Text[1].length - 1));
    const slot2 = (typeof slot2Text === "string" ? slot2Text.substring(0, slot2Text.length - 1) : slot2Text[1].substring(0, slot2Text[1].length - 1)).toUpperCase();
    if (isNaN(order1) || isNaN(order2)) {
        if (m instanceof Message) m.reply(`Invalid slot order for **${slot1Text}** or **${slot2Text}**, please provide a valid slot.`);
        else m.editReply(`Invalid slot order for **${slot1Text}** or **${slot2Text}**, please provide a valid slot.`);
        return;
    }
    const pool2 = !pool2Text ? pool2Text : typeof pool2Text === "string" ? pool2Text : pool2Text[0];

    const mappool1 = await fetchMappool(m, tournament, pool1);
    if (!mappool1) 
        return;
    const mappool2 = !pool2 ? mappool1 : await fetchMappool(m, tournament, pool2);
    if (!mappool2) 
        return;
    
    const mappoolSlot1 = `${mappool1.abbreviation.toUpperCase()} ${slot1}${order1}`;
    const mappoolSlot2 = `${mappool2.abbreviation.toUpperCase()} ${slot2}${order2}`;

    const slotMod1 = await fetchSlot(m, mappool1, slot1.toString(), true);
    if (!slotMod1) 
        return;

    const slotMod2 = !pool2 ? await fetchSlot(m, mappool1, slot2.toString(), true) : await fetchSlot(m, mappool2, slot2.toString(), true);
    if (!slotMod2) 
        return;

    const mappoolMap1 = slotMod1.maps.find(m => m.order === order1);
    if (!mappoolMap1) {
        if (m instanceof Message) m.reply(`Could not find **${slot1}${order1}**`);
        else m.editReply(`Could not find **${slot1}${order1}**`);
        return;
    }
    const mappoolMap2 = slotMod2.maps.find(m => m.order === order2);
    if (!mappoolMap2) {
        if (m instanceof Message) m.reply(`Could not find **${slot2}${order2}**`);
        else m.editReply(`Could not find **${slot2}${order2}**`);
        return;
    }

    // Confirm swap before swapping
    const name1 = mappoolMap1.beatmap ? `${mappoolMap1.beatmap.beatmapset.artist} - ${mappoolMap1.beatmap.beatmapset.title} [${mappoolMap1.beatmap.difficulty}]` : mappoolMap1.customBeatmap ? `${mappoolMap1.customBeatmap.artist} - ${mappoolMap1.customBeatmap.title} [${mappoolMap1.customBeatmap.difficulty}]` : "Nothing";
    const name2 = mappoolMap2.beatmap ? `${mappoolMap2.beatmap.beatmapset.artist} - ${mappoolMap2.beatmap.beatmapset.title} [${mappoolMap2.beatmap.difficulty}]` : mappoolMap2.customBeatmap ? `${mappoolMap2.customBeatmap.artist} - ${mappoolMap2.customBeatmap.title} [${mappoolMap2.customBeatmap.difficulty}]` : "Nothing";
    const confirm = await m.channel!.send({
        content: `Are you sure you want to swap **${slot1}${order1}** (${name1}) with **${slot2}${order2}** (${name2})?`,
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("yes")
                        .setLabel("YES")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId("no")
                        .setLabel("NO")
                        .setStyle(ButtonStyle.Danger)
                ),
        ],
    });

    const filter = (i: MessageComponentInteraction) => i.user.id === (m instanceof Message ? m.author.id : m.user.id);
    const collector = confirm.createMessageComponentCollector({ filter, time: 6000000 });

    let stop = await new Promise<boolean>((resolve) => {
            let done = false;
            collector.on("collect", async i => {
                if (i.customId === "yes") {
                    done = true;
                    await i.reply("Swapping...");
                    setTimeout(async () => (await i.deleteReply()), 100);
                    collector.stop();
                    await confirm.delete();
                    return resolve(false);
                } else if (i.customId === "no") {
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
    let log1: MappoolMapHistory | undefined = new MappoolMapHistory();
    let log2: MappoolMapHistory | undefined = new MappoolMapHistory();

    log1.createdBy = log2.createdBy = user;

    if (beatmap1) {
        if (beatmap1 instanceof CustomBeatmap) {
            mappoolMap2.beatmap = null;
            mappoolMap2.customBeatmap = beatmap1;
            mappoolMap2.isCustom = true;

            log1.artist = beatmap1.artist;
            log1.title = beatmap1.title;
            log1.difficulty = beatmap1.difficulty;
            log1.link = beatmap1.link;

            mappoolMap1.customBeatmap = null;
            await mappoolMap1.save();
        } else {
            mappoolMap2.beatmap = beatmap1;
            mappoolMap2.customBeatmap = null;
            mappoolMap2.isCustom = false;

            log1.beatmap = beatmap1;
        }

        mappoolMap2.assignedBy = user;
    } else {
        mappoolMap2.beatmap = null;
        mappoolMap2.customBeatmap = null;
        mappoolMap2.isCustom = false;

        log1 = undefined;
    }
    mappoolMap2.customMappers = customMappers1;
    mappoolMap2.testplayers = testplayers1;
    if (mappoolMap2.customThreadID && mappoolMap2.customMappers.length === 0) {
        const thread = await discordClient.channels.fetch(mappoolMap2.customThreadID) as ThreadChannel | null;
        if (thread) {
            await thread.setAppliedTags([], "**All mappers** are removed. The thread is now archived.");
            await thread.setArchived(true, "**All mappers** are removed. The thread is now archived.");
        }
        mappoolMap2.customThreadID = null;
        mappoolMap2.customMessageID = null;
    } else if (mappoolMap2.customMappers.length > 0) {
        const customThread = await fetchCustomThread(m, mappoolMap2, tournament, mappoolSlot2);
        if (!customThread)
            return;
        if (customThread !== true && m.channel?.id !== customThread[0].id) {
            const [thread, threadMsg] = customThread;
            mappoolMap2.customThreadID = thread.id;
            mappoolMap2.customMessageID = threadMsg.id;
            await thread.send(`<@${user.discord.userID}> has swapped this slot with **${slot1}${order1}** (${name1})`);
        }
    }

    if (beatmap2) {
        if (beatmap2 instanceof CustomBeatmap) {
            mappoolMap1.beatmap = null;
            mappoolMap1.customBeatmap = beatmap2;
            mappoolMap1.isCustom = true;

            log2.artist = beatmap2.artist;
            log2.title = beatmap2.title;
            log2.difficulty = beatmap2.difficulty;
            log2.link = beatmap2.link;
            
            mappoolMap2.customBeatmap = null;
            await mappoolMap2.save();
        } else {
            mappoolMap1.beatmap = beatmap2;
            mappoolMap1.customBeatmap = null;
            mappoolMap1.isCustom = false;

            log2.beatmap = beatmap2;
        }

        mappoolMap1.assignedBy = user;
    } else {
        mappoolMap1.beatmap = null;
        mappoolMap1.customBeatmap = null;
        mappoolMap1.isCustom = false;

        log2 = undefined;
    }
    mappoolMap1.customMappers = customMappers2;
    mappoolMap1.testplayers = testplayers2;
    if (mappoolMap1.customThreadID && mappoolMap1.customMappers.length === 0) {
        const thread = await discordClient.channels.fetch(mappoolMap1.customThreadID) as ThreadChannel | null;
        if (thread) {
            await thread.setAppliedTags([], "**All mappers** are removed. The thread is now archived.");
            await thread.setArchived(true, "**All mappers** are removed. The thread is now archived.");
        }
        mappoolMap1.customThreadID = null;
        mappoolMap1.customMessageID = null;
    } else if (mappoolMap1.customMappers.length > 0) {
        const customThread = await fetchCustomThread(m, mappoolMap1, tournament, mappoolSlot1);
        if (!customThread)
            return;
        if (customThread !== true && m.channel?.id !== customThread[0].id) {
            const [thread, threadMsg] = customThread;
            mappoolMap1.customThreadID = thread.id;
            mappoolMap1.customMessageID = threadMsg.id;
            await thread.send(`<@${user.discord.userID}> has swapped this slot with **${slot1}${order1}** (${name1})`);
        }
    }

    await mappoolMap1.save();
    await mappoolMap2.save();

    if (log1) await log1.save()
    if (log2) await log2.save()

    if (m instanceof Message) m.reply(`Swapped **${slot1}${order1}** with **${slot2}${order2}**`);
    else await m.editReply(`Swapped **${slot1}${order1}** with **${slot2}${order2}**`);

    await mappoolLog(tournament, "swap", user, `Swapped **${slot1}${order1}** with **${slot2}${order2}**\n${log2 ? `**${slot1}${order1}** is now ${log2.beatmap ? `${log2.beatmap.beatmapset.artist} - ${log2.beatmap.beatmapset.title} [${log2.beatmap.difficulty}]` : `${log2.artist} - ${log2.title} [${log2.difficulty}]`}` : `**${slot1}${order1}** is now empty`}\n${log1 ? `**${slot2}${order2}** is now ${log1.beatmap ? `${log1.beatmap.beatmapset.artist} - ${log1.beatmap.beatmapset.title} [${log1.beatmap.difficulty}]` : `${log1.artist} - ${log1.title} [${log1.difficulty}]`}` : `**${slot2}${order2}** is now empty`}`);
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