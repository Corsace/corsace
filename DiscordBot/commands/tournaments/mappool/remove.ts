import { ChatInputCommandInteraction, Message, SlashCommandBuilder, ThreadChannel } from "discord.js";
import { Command } from "../../index";
import { confirmCommand, fetchCustomThread, fetchMappool, fetchSlot, fetchStaff, fetchTournament, hasTournamentRoles, isSecuredChannel, mappoolLog } from "../../../functions/tournamentFunctions";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { User } from "../../../../Models/user";
import { loginResponse } from "../../../functions/loginResponse";
import { CustomBeatmap } from "../../../../Models/tournaments/mappools/customBeatmap";
import { discordClient } from "../../../../Server/discord";

async function run (m: Message | ChatInputCommandInteraction) {
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

    const testing = (m instanceof ChatInputCommandInteraction ? m.options.getBoolean("tester") : /-test Y/i.test(m.content));
    if (testing && m instanceof Message)    
        m.content = m.content.replace(/-test Y/i, "");

    const poolRegex = /-p (\S+)/;
    const slotRegex = /-s (\S+)/;
    const targetRegex = /-t (.+)/;
    const poolText = m instanceof Message ? m.content.match(poolRegex) ?? m.content.split(" ")[1] : m.options.getString("pool");
    const slotText = m instanceof Message ? m.content.match(slotRegex) ?? m.content.split(" ")[2] : m.options.getString("slot");
    const targetText = m instanceof Message ? m.mentions.users.first()?.username ?? m.content.match(targetRegex) ?? m.content.split(" ").slice(3, m.content.split(" ").length).join(" ") : m.options.getUser("user")?.id;
    if (!poolText) {
        if (m instanceof Message) m.reply("Missing parameters. Please use `-p <pool> [-s <slot>] [-t <target>]` or `<pool> [slot] [target]`. If you do not use the `-` prefixes, the order of the parameters is important.");
        else m.editReply("Missing parameters. Please use `-p <pool> [-s <slot>] [-t <target>]` or `<pool> [slot] [target]`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const pool = typeof poolText === "string" ? poolText : poolText[0];

    const mappool = await fetchMappool(m, tournament, pool, false, slotText ? false : true, slotText ? false : true);
    if (!mappool) 
        return;

    if (slotText) {
        const order = parseInt(typeof slotText === "string" ? slotText.substring(slotText.length - 1) : slotText[1].substring(slotText[1].length - 1));
        const slot = (typeof slotText === "string" ? slotText.substring(0, slotText.length - 1) : slotText[1].substring(0, slotText[1].length - 1)).toUpperCase();

        if (isNaN(order)) {
            if (m instanceof Message) m.reply("Invalid slot number. Please use a valid slot number.");
            else m.editReply("Invalid slot number. Please use a valid slot number.");
            return;
        }
        const mappoolSlot = `${mappool.abbreviation.toUpperCase()} ${slot}${order}`;

        const slotMod = await fetchSlot(m, mappool, slot, true);
        if (!slotMod) 
            return;

        const mappoolMap = slotMod.maps.find(m => m.order === order);
        if (!mappoolMap) {
            if (m instanceof Message) m.reply(`Could not find **${mappoolSlot}**`);
            else m.editReply(`Could not find **${mappoolSlot}**`);
            return;
        }
        if (mappoolMap.beatmap) {
            const map = mappoolMap.beatmap;
            mappoolMap.beatmap = null;
            await mappoolMap.save();

            if (m instanceof Message) m.reply(`Removed **${map.beatmapset.artist} - ${map.beatmapset.title} [${map.difficulty}]** from **${mappoolSlot}**`);
            else m.editReply(`Removed **${map.beatmapset.artist} - ${map.beatmapset.title} [${map.difficulty}]** from **${mappoolSlot}**`);
            
            await mappoolLog(tournament, "remove", user, `Removed **${map.beatmapset.artist} - ${map.beatmapset.title} [${map.difficulty}]** from **${mappoolSlot}**`)
            return;
        }

        let name = "";
        let customMap: CustomBeatmap | null = null;
        if (mappoolMap.customBeatmap) {
            customMap = mappoolMap.customBeatmap;
            mappoolMap.customBeatmap = null;

            name = `${customMap.artist} - ${customMap.title} [${customMap.difficulty}] `;
        }
    
        if (targetText) {
            const target = typeof targetText === "string" ? targetText : targetText[0];
            const targetUser = await fetchStaff(m, tournament, target, [TournamentRoleType.Testplayers, TournamentRoleType.Mappers, TournamentRoleType.Mappoolers, TournamentRoleType.Organizer]);
            if (!targetUser) 
                return;

            if (!testing && !mappoolMap.customMappers.some(u => u.ID === targetUser.ID)) {
                if (m instanceof Message) m.reply(`**${targetUser.osu.username}** is not a mapper for **${mappoolSlot}**`);
                else m.editReply(`**${targetUser.osu.username}** is not a mapper for **${mappoolSlot}**`);
                return;
            }
            if (testing && !mappoolMap.testplayers.some(u => u.ID === targetUser.ID)) {
                if (m instanceof Message) m.reply(`**${targetUser.osu.username}** is not a tester for **${mappoolSlot}**`);
                else m.editReply(`**${targetUser.osu.username}** is not a tester for **${mappoolSlot}**`);
                return;
            }

            if (testing) {
                mappoolMap.testplayers = mappoolMap.testplayers.filter(u => u.ID !== targetUser.ID);

                const customThread = await fetchCustomThread(m, mappoolMap, tournament, mappoolSlot);
                if (!customThread)
                    return;
                if (customThread !== true && m.channel?.id !== customThread[0].id) {
                    const [thread] = customThread;
                    await thread.send(`<@${user.discord.userID}> has removed playtester **${targetUser.osu.username}**`);
                }

                await mappoolMap.save();

                if (m instanceof Message) m.reply(`Removed **${targetUser.osu.username}** from playtesting **${mappoolSlot}**`);
                else m.editReply(`Removed **${targetUser.osu.username}** from playtesting **${mappoolSlot}**`);

                await mappoolLog(tournament, "remove (playtester)", user, `Removed **${targetUser.osu.username}** from playtesting **${mappoolSlot}**`)
                return;
            }

            mappoolMap.customMappers = mappoolMap.customMappers.filter(u => u.ID !== targetUser.ID);

            if (mappoolMap.customMappers.length > 0) {
                const customThread = await fetchCustomThread(m, mappoolMap, tournament, mappoolSlot);
                if (!customThread)
                    return;
                if (customThread !== true && m.channel?.id !== customThread[0].id) {
                    const [thread] = customThread;
                    await thread.send(`<@${user.discord.userID}> has removed **${targetUser.osu.username}**`);
                }

                await mappoolMap.save();

                if (m instanceof Message) m.reply(`Removed **${targetUser.osu.username}** from **${mappoolSlot}**`);
                else m.editReply(`Removed **${targetUser.osu.username}** from **${mappoolSlot}**`);

                await mappoolLog(tournament, "remove", user, `Removed **${targetUser.osu.username}** from **${mappoolSlot}**`)
                return;
            }
        }

        mappoolMap.testplayers = [];

        if (testing) {
            const customThread = await fetchCustomThread(m, mappoolMap, tournament, mappoolSlot);
            if (!customThread)
                return;
            if (customThread !== true && m.channel?.id !== customThread[0].id) {
                const [thread] = customThread;
                await thread.send(`<@${user.discord.userID}> has removed **all testplayers**`);
            }

            if (m instanceof Message) m.reply(`Removed all testplayers from **${mappoolSlot}**`);
            else m.editReply(`Removed all testplayers from **${mappoolSlot}**`);

            await mappoolLog(tournament, "remove", user, `Removed all testplayers from **${mappoolSlot}**`)
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

        if (m instanceof Message) m.reply(`Removed the custom map ${name !== "" ? "**" + name + "**" : ""}and mappers from **${mappoolSlot}**`);
        else m.editReply(`Removed the custom map ${name !== "" ? "**" + name + "**" : ""}and mappers from **${mappoolSlot}**`);

        await mappoolLog(tournament, "remove", user, `Removed the custom map ${name !== "" ? "**" + name + "**" : ""}and mappers from **${mappoolSlot}**`)
        return;
    }

    const confirm = await confirmCommand(m, "Are you sure you want to remove **ALL** beatmaps, custom beatmaps and mappers from this mappool?\n**This action cannot be undone.**");
    if (!confirm) {
        if (m instanceof Message) m.reply("Ok Lol");
        else m.editReply("Ok Lol");
        return;
    }

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
                const customThread = await fetchCustomThread(m, map, tournament, `${mappool.abbreviation.toUpperCase()} ${slot}${map.order}`);
                if (!customThread)
                    return;
                if (customThread !== true && m.channel?.id !== customThread[0].id) {
                    const [thread] = customThread;
                    await thread.send(`<@${user.discord.userID}> has removed **all testplayers**`);
                }
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

    if (m instanceof Message) m.reply(`Removed all beatmaps and custom beatmaps + mappers from **${mappool.abbreviation.toUpperCase()}**`);
    else m.editReply(`Removed all beatmaps and custom beatmaps + mappers from **${mappool.abbreviation.toUpperCase()}**`);

    await mappoolLog(tournament, "remove", user, `Removed all beatmaps and custom beatmaps + mappers from **${mappool.abbreviation.toUpperCase()}**`)
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

const mappoolRemove: Command = {
    data,
    alternativeNames: [ "remove_mappool", "mappool-remove", "remove-mappool", "mappoolremove", "removemappool", "removep", "premove", "pool_remove", "remove_pool", "pool-remove", "remove-pool", "poolremove", "removepool", "mappool_rm", "rm_mappool", "mappool-rm", "rm-mappool", "mappoolrm", "rmmappool", "rmp", "prm", "pool_rm", "rm_pool", "pool-rm", "rm-pool", "poolrm", "rmpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolRemove;