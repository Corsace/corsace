import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../index";
import { fetchCustomThread, fetchMappool, fetchSlot, fetchStaff, fetchTournament, hasTournamentRoles, isSecuredChannel, mappoolLog } from "../../../functions/tournamentFunctions";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { Beatmap } from "../../../../Models/beatmap";
import { Beatmap as APIBeatmap, Mode } from "nodesu";
import { osuClient } from "../../../../Server/osu";
import { insertBeatmap } from "../../../../Server/scripts/fetchYearMaps";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import beatmapEmbed from "../../../functions/beatmapEmbed";
import { User } from "../../../../Models/user";
import { loginResponse } from "../../../functions/loginResponse";
import { MappoolMapHistory } from "../../../../Models/tournaments/mappools/mappoolMapHistory";

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

    const replace = (m instanceof ChatInputCommandInteraction ? m.options.getBoolean("replace") : /-r Y/i.test(m.content));
    if (replace && m instanceof Message)
        m.content = m.content.replace(/-r Y/i, "");
    
    const testing = (m instanceof ChatInputCommandInteraction ? m.options.getSubcommand() === "tester": /-test Y/i.test(m.content));
    if (testing && m instanceof Message)    
        m.content = m.content.replace(/-test Y/i, "");

    const targetRegex = /-t (.+)/;
    const poolRegex = /-p (\S+)/;
    const slotRegex = /-s (\S+)/;
    const targetText = m instanceof Message ? m.mentions.users.first()?.username ?? m.content.match(targetRegex) ?? m.content.split(" ").slice(3, m.content.split(" ").length).join(" ") : m.options.getSubcommand() === "custom" || m.options.getSubcommand() === "tester" ? m.options.getUser("user")?.id : m.options.getString("link");
    const poolText = m instanceof Message ? m.content.match(poolRegex) ?? m.content.split(" ")[1] : m.options.getString("pool");
    const slotText = m instanceof Message ? m.content.match(slotRegex) ?? m.content.split(" ")[2] : m.options.getString("slot");
    if (!poolText || !slotText || !targetText) {
        if (m instanceof Message) m.reply("Missing parameters. Please use `-p <pool> -s <slot> -t <target>` or `<pool> <slot> <target>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        else m.editReply("Missing parameters. Please use `/assign <pool> <slot> <target>`.");
        return;
    }

    const target = typeof targetText === "string" ? targetText : targetText[1];
    const pool = typeof poolText === "string" ? poolText : poolText[1];
    const order = parseInt(typeof slotText === "string" ? slotText.substring(slotText.length - 1) : slotText[1].substring(slotText[1].length - 1));
    const slot = (typeof slotText === "string" ? slotText.substring(0, slotText.length - 1) : slotText[1].substring(0, slotText[1].length - 1)).toUpperCase();

    if (isNaN(order)) {
        if (m instanceof Message) m.reply("Invalid slot number. Please use a valid slot number.");
        else m.editReply("Invalid slot number. Please use a valid slot number.");
        return;
    }

    const mappool = await fetchMappool(m, tournament, pool);
    if (!mappool) 
        return;
    const mappoolSlot = `${mappool.abbreviation.toUpperCase()} ${slot}${order}`;

    const slotMod = await fetchSlot(m, mappool, slot.toString(), true);
    if (!slotMod) 
        return;

    const mappoolMap = slotMod.maps.find(m => m.order === order);
    if (!mappoolMap) {
        if (m instanceof Message) m.reply(`Could not find map **${mappoolSlot}**`);
        else m.editReply(`Could not find map **${mappoolSlot}**`);
        return;
    }

    const assigner = await User.findOne({
        where: {
            discord: {
                userID: m instanceof Message ? m.author.id : m.user.id,
            },
        },
    })
    if (!assigner) {
        await loginResponse(m);
        return;
    }
    mappoolMap.assignedBy = assigner;

    // Check if target is link
    if ((m instanceof ChatInputCommandInteraction && m.options.getSubcommand() === "link") || target.includes("osu.ppy.sh/beatmaps")) {
        const linkRegex = /https?:\/\/osu.ppy.sh\/beatmapsets\/(\d+)#(osu|taiko|fruits|mania)\/(\d+)/;
        const link = target.match(linkRegex);
        if (!link) {
            if (m instanceof Message) m.reply("Invalid link. Please use a valid osu! beatmap link that contains the set id and beatmap id (e.g. https://osu.ppy.sh/beatmapsets/1234567#osu/1234567).");
            else m.editReply("Invalid link. Please use a valid osu! beatmap link that contains the set id and beatmap id (e.g. https://osu.ppy.sh/beatmapsets/1234567#osu/1234567).");
            return;
        }
        const beatmapID = parseInt(link[3]);
        
        const set = (await osuClient.beatmaps.getBySetId(parseInt(link[1]), Mode.all, undefined, undefined, slotMod.allowedMods) as APIBeatmap[]);
        const apiMap = set.find(m => m.beatmapId === beatmapID)
        if (!apiMap) {
            if (m instanceof Message) m.reply("Could not find beatmap on osu!api.");
            else m.editReply("Could not find beatmap on osu!api.");
            return;
        }
        if (apiMap.mode !== tournament.mode.ID - 1) {
            if (m instanceof Message) m.reply("Beatmap mode does not match tournament mode.");
            else m.editReply("Beatmap mode does not match tournament mode.");
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

        if (mappoolMap.beatmap && mappoolMap.beatmap.ID === beatmap.ID) {
            if (m instanceof Message) m.reply(`**${mappoolSlot}** is already set to this beatmap.`);
            else m.editReply(`**${mappoolSlot}** is already set to this beatmap.`);
            return;
        }

        mappoolMap.beatmap = beatmap;
        mappoolMap.isCustom = false;
        mappoolMap.deadline = null;
        mappoolMap.customMappers = [];
        if (mappoolMap.customBeatmap) {
            const customMap = mappoolMap.customBeatmap;
            mappoolMap.customBeatmap = undefined;
            await customMap.remove();
        }
        await mappoolMap.save();

        const log = new MappoolMapHistory();
        log.createdBy = assigner;
        log.mappoolMap = mappoolMap;
        log.beatmap = beatmap;
        await log.save();

        const mappoolMapEmbed = await beatmapEmbed(apiMap, slot, set);
        mappoolMapEmbed.data.author!.name = `${mappoolSlot}: ${mappoolMapEmbed.data.author!.name}`;

        if (m instanceof Message) m.reply({
            content: `Successfully set **${mappoolSlot}** to **${beatmap.beatmapset.artist} - ${beatmap.beatmapset.title} [${beatmap.difficulty}]**`,
            embeds: [mappoolMapEmbed],
        });
        else m.editReply({
            content: `Successfully set **${mappoolSlot}** to **${beatmap.beatmapset.artist} - ${beatmap.beatmapset.title} [${beatmap.difficulty}]**`,
            embeds: [mappoolMapEmbed],
        });

        await mappoolLog(tournament, "assign", assigner, log, slotMod, mappool);
        return;
    }

    // Check if user has any mapper/tester roles
    const user = await fetchStaff(m, tournament, target, [testing ? TournamentRoleType.Mappers : TournamentRoleType.Testplayers, TournamentRoleType.Mappoolers, TournamentRoleType.Organizer]);
    if (!user) 
        return;
    
    if (testing) {
        if (mappoolMap.testplayers.find(u => u.ID === user.ID)) {
            if (m instanceof Message) m.reply(`**${user.osu.username}** is already assigned as a testplayer to **${mappoolSlot}**`);
            else m.editReply(`**${user.osu.username}** is already assigned as a testplayer to **${mappoolSlot}**`);
            return;
        }

        if (replace)
            mappoolMap.testplayers = [user];
        else
            mappoolMap.testplayers.push(user);
    } else {
        if (mappoolMap.customMappers.find(u => u.ID === user.ID)) {
            if (m instanceof Message) m.reply(`**${user.osu.username}** is already assigned as a mapper to **${mappoolSlot}**`);
            else m.editReply(`**${user.osu.username}** is already assigned as a mapper to **${mappoolSlot}**`);
            return;
        }

        mappoolMap.beatmap = null;
        mappoolMap.isCustom = true;
        if (replace)
            mappoolMap.customMappers = [user];
        else
            mappoolMap.customMappers.push(user);
    }

    const customThread = await fetchCustomThread(m, mappoolMap, tournament, mappoolSlot);
    if (!customThread)
        return;
    if (customThread !== true && m.channel?.id !== customThread[0].id) {
        const [thread, threadMsg] = customThread;
        mappoolMap.customThreadID = thread.id;
        mappoolMap.customMessageID = threadMsg.id;
        await thread.send(`<@${user.discord.userID}> has been added as a ${testing ? "testplayer" : "custom mapper"}`);
    }

    await mappoolMap.save();
    if (m instanceof Message) m.reply(`Successfully added **${user.osu.username}** as a mapper for **${mappoolSlot}**`);
    else m.editReply(`Successfully added **${user.osu.username}** as a mapper for **${mappoolSlot}**`);

    await mappoolLog(tournament, "assign", assigner, `**${user.osu.username}** is now a custom mapper for **${mappoolSlot}**`);
}

const data = new SlashCommandBuilder()
    .setName("mappool_assign")
    .setDescription("Assign a beatmap or mapper to a mappool slot.")
    .addSubcommand(subcommand =>
        subcommand.setName("tester")
            .setDescription("Assign a tester to a mappool slot.")
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
                    .setRequired(false)))
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

const mappoolAssign: Command = {
    data,
    alternativeNames: [ "assign_mappool", "mappool-assign", "assign-mappool", "mappoolassign", "assignmappool", "assignp", "passign", "pool_assign", "assign_pool", "pool-assign", "assign-pool", "poolassign", "assignpool", "mappool_a", "a_mappool", "mappool-a", "a-mappool", "mappoola", "amappool", "ap", "pa", "pool_a", "a_pool", "pool-a", "a-pool", "poola", "apool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolAssign;