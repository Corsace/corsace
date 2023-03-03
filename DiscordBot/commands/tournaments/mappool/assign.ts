import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, GuildMember, User as DiscordUser, Message, MessageComponentInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../index";
import { Tournament, TournamentStatus } from "../../../../Models/tournaments/tournament";
import { fetchMappool, fetchSlot, fetchStaff, fetchTournament, hasTournamentRoles, isSecuredChannel } from "../../../functions/tournamentFunctions";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { Brackets } from "typeorm";
import { filter } from "../../../functions/messageInteractionFunctions";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { Beatmap } from "../../../../Models/beatmap";
import { Beatmap as APIBeatmap } from "nodesu";
import { osuClient } from "../../../../Server/osu";
import { insertBeatmap } from "../../../../Server/scripts/fetchYearMaps";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";

async function run (m: Message | ChatInputCommandInteraction) {
    const tournament = await fetchTournament(m, []);
    if (!tournament)
        return;

    const allowed = await hasTournamentRoles(m, tournament, [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]);
    if (!allowed)
        return;
    const securedChannel = await isSecuredChannel(m, tournament, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.MappoolLog, TournamentChannelType.MappoolQA, TournamentChannelType.Testplayers]);
    if (!securedChannel)
        return;

    const targetRegex = /-t (\S+)/;
    const poolRegex = /-p (\S+)/;
    const slotRegex = /-s (\S+)/;
    const targetText = m instanceof Message ? m.content.match(targetRegex) ?? m.content.split(" ")[1] : m.options.getSubcommand() === "custom" ? m.options.getUser("user")?.id : m.options.getString("link");
    const poolText = m instanceof Message ? m.content.match(poolRegex) ?? m.content.split(" ")[2] : m.options.getString("pool");
    const slotText = m instanceof Message ? m.content.match(slotRegex) ?? m.content.split(" ")[3] : m.options.getString("slot");
    if (!poolText || !slotText || !targetText) {
        m.reply("Missing parameters. Please use `-t <target> -p <pool> -s <slot>` or `<target> <pool> <slot>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const target = typeof targetText === "string" ? targetText : targetText[0];
    const pool = typeof poolText === "string" ? poolText : poolText[0];
    const order = parseInt(typeof slotText === "string" ? slotText.substring(slotText.length - 1) : slotText[0].substring(slotText[0].length - 1));
    const slot = parseInt(typeof slotText === "string" ? slotText.substring(0, slotText.length - 1) : slotText[0].substring(0, slotText[0].length - 1));
    if (!pool || !slot || !target || !order) {
        m.reply("Missing parameters. Please use `-p <pool> -s <slot> -t <target>` or `<pool> <slot> <target>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }
    if (isNaN(order)) {
        m.reply("Invalid slot number. Please use a valid slot number.");
        return;
    }

    const mappool = await fetchMappool(m, tournament, pool);
    if (!mappool)
        return;

    const slotMod = await fetchSlot(m, mappool, slot.toString());
    if (!slotMod)
        return;

    const mappoolMap = slotMod.maps.find(m => m.order === order);
    if (!mappoolMap) {
        m.reply(`Could not find map **${order}**`);
        return;
    }

    // Check if target is link
    const linkRegex = /https:\/\/osu.ppy.sh\/beatmapsets\/(\d+)#(osu|taiko|fruits|mania)\/(\d+)/;
    const link = target.match(linkRegex);
    if (link) {
        const beatmapID = parseInt(link[3]);
        let beatmap = await Beatmap.findOne({
            where: {
                ID: beatmapID,
            },
        });
        if (!beatmap) {
            const apiMap = (await osuClient.beatmaps.getByBeatmapId(beatmapID) as APIBeatmap[]);
            if (apiMap.length === 0) {
                m.reply("Could not find beatmap on osu!api.");
                return;
            }
            beatmap = await insertBeatmap(apiMap[0]);
        }
        if (mappoolMap.beatmap.ID === beatmap.ID) {
            m.reply(`**${slot}${order}** is already set to this beatmap.`);
            return;
        }

        mappoolMap.beatmap = beatmap;
        await mappoolMap.save();

        const mappoolMapEmbed = new EmbedBuilder()
            .setTitle(`Map ${slot}${order}: ${beatmap.beatmapset.artist} - ${beatmap.beatmapset.title} [${beatmap.difficulty}]`)
            .setURL(`https://osu.ppy.sh/beatmapsets/${beatmap.beatmapset.ID}#osu/${beatmap.ID}`)
            .setThumbnail(`https://b.ppy.sh/thumb/${beatmap.beatmapset.ID}l.jpg`)
            .addFields(
                {
                    name: "BPM",
                    value: beatmap.beatmapset.BPM.toString(),
                    inline: true,
                },
            );


        m.reply({
            content: `Successfully set **${slot}${order}** to **${beatmap.beatmapset.artist} - ${beatmap.beatmapset.title} [${beatmap.difficulty}]**`,
            embeds: [mappoolMapEmbed],
        });
        return;
    }

    // Check if user has any mapper roles
    const user = await fetchStaff(m, tournament, target, [TournamentRoleType.Mappers, TournamentRoleType.Mappoolers, TournamentRoleType.Organizer]);
    if (!user)
        return;
    
    if (mappoolMap.customMappers?.find(u => u.ID === user.ID)) {
        m.reply(`**${user.osu.username}** is already a mapper for **${slot}${order}**`);
        return;
    }

    mappoolMap.isCustom = true;
    if (!mappoolMap.customMappers || (m as ChatInputCommandInteraction).options.getBoolean("replace")!)
        mappoolMap.customMappers = [user];
    else
        mappoolMap.customMappers.push(user);

    await mappoolMap.save();
    m.reply(`Successfully added **${user.osu.username}** as a mapper for map **${slot}${order}**`);

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
                    .setDescription("Whether to replace the existing mapper, or to add on.")
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
    alternativeNames: ["assign_mappool", "mappool-assign", "assign-mappool", "mappoolassign", "assignmappool", "assignp", "passign", "mappoola", "amappool", "pool_assign", "assign_pool", "pool-assign", "assign-pool", "poolassign", "assignpool", "poola", "apool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolAssign;