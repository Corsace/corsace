import { Message, EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, TextChannel } from "discord.js";
import { Command } from "../../index";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { fetchStaff, fetchTournament, hasTournamentRoles, isSecuredChannel } from "../../../functions/tournamentFunctions";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { Brackets } from "typeorm";
import { User } from "../../../../Models/user";
import { loginResponse } from "../../../functions/loginResponse";

async function assignmentListDM(m: Message | ChatInputCommandInteraction) {
    // Check if they had -incfin in their text, or if they said true for the include_finished option in the slash command
    const all = m instanceof Message ? m.content.includes("-incfin") : m.options.getBoolean("include_finished");

    // Get all mappoolMaps the user is assigned to, and get all the tournaments they are in
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

    const mappoolMaps = (await MappoolSlot
        .createQueryBuilder("slot")
        .leftJoinAndSelect("slot.mappool", "mappool")
        .leftJoinAndSelect("mappool.stage", "stage")
        .leftJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("slot.maps", "maps")
        .leftJoinAndSelect("maps.beatmap", "beatmap")
        .leftJoinAndSelect("maps.customMappers", "customMapper")
        .leftJoinAndSelect("maps.testplayers", "testplayer")
        .where(all ? "1 = 1" : "tournament.status != 3")
        .andWhere(new Brackets(qb => {
            qb.where("customMapper.ID = :user")
                .orWhere("testplayer.ID = :user")
        }))
        .setParameters({
            user: user.ID,
        })
        .getMany()).map(s => s.maps.map(m => {
            m.slot = s;
            return m;
        })).flat();

    if (mappoolMaps.length === 0) {
        if (m instanceof Message) await m.reply("No maps found for this user.");
        else await m.editReply("No maps found for this user.");
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle("Mappool Assignments")
        .setDescription(`Here are your current mappool assignments`)
        .setTimestamp(new Date())
        .setFields();

    let replied = false;
    for (const map of mappoolMaps) {
        embed.addFields(
            { name: `**${map.slot.mappool.stage.tournament.abbreviation}${map.slot.mappool.stage.tournament.year}** ${map.slot.mappool.abbreviation.toUpperCase()} ${map.slot.acronym}${map.order}`, value: `${map.customBeatmap ? `${map.customBeatmap.artist} - ${map.customBeatmap.title} [${map.customBeatmap.difficulty}]` : "No Submitted Beatmap"}\nDeadline: ${map.deadline ? `<t:${map.deadline.getTime() / 1000}:F> (<t:${map.deadline.getTime() / 1000}:R>)` : "No Deadline For Beatmap"}`, inline: true },
        );

        if (embed.data.fields!.length === 25) {
            if (!replied) {
                if (m instanceof Message) await m.reply({ embeds: [embed] });
                else await m.editReply({ embeds: [embed] });
                replied = true;
            } else {
                (m.channel as TextChannel).send({ embeds: [embed] });
            }
            embed.data.fields = [];
        }
    }    

    if (!replied || embed.data.fields!.length > 0) {
        if (embed.data.fields!.length === 0)
            embed.addFields({ name: "No Maps Found", value: "No maps found with the given parameters."});
        
        if (m instanceof Message) m.reply({ embeds: [embed] });
        else m.editReply({ embeds: [embed] });
    }
}

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    // Give the user's own assignments if they are in a DM
    if (m.channel?.type === ChannelType.DM) {
        assignmentListDM(m);
        return;
    }

    if (m instanceof Message ? m.content.includes("-all") : m.options.getBoolean("all")) {
        if (m instanceof Message) await m.reply("`-all` is not allowed outside of DMs, as it shows your assignments across all pools and tournaments.");
        else await m.editReply("You cannot use the `all` option outside of DMs, as it shows your assignments across all pools and tournaments");
        return;
    }

    const tournament = await fetchTournament(m);
    if (!tournament) 
        return;

    const allowed = await hasTournamentRoles(m, tournament, [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers]);
    if (!allowed) 
        return;

    // Get specific pool and user
    const poolRegex = /-p (\S+)/;
    const userRegex = /-u (\S+)/;
    const poolText = m instanceof Message ? m.content.match(poolRegex) ?? m.content.split(" ")[1] : m.options.getString("pool");
    const userText = m instanceof Message ? m.content.match(userRegex) ?? m.content.split(" ").slice(2, m.content.split(" ").length).join(" ") : m.options.getUser("user")?.id;

    const pool = poolText ? typeof poolText === "string" ? poolText : poolText[0] : "";
    const target = userText ? typeof userText === "string" ? userText : userText[0] : "";

    let targetUser: User | null | undefined;
    if (target !== "") {
        targetUser = await fetchStaff(m, tournament, target, [TournamentRoleType.Mappers, TournamentRoleType.Mappoolers, TournamentRoleType.Organizer]);
        if (!targetUser)
            return;
    }

    const mappoolMaps = (await MappoolSlot
        .createQueryBuilder("slot")
        .leftJoinAndSelect("slot.mappool", "mappool")
        .leftJoinAndSelect("mappool.stage", "stage")
        .leftJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("slot.maps", "maps")
        .leftJoinAndSelect("maps.beatmap", "beatmap")
        .leftJoinAndSelect("maps.customMappers", "customMapper")
        .leftJoinAndSelect("maps.testplayers", "testplayer")
        .where("tournament.ID = :tournament")
        .andWhere(targetUser ? new Brackets(qb => {
            qb.where(`customMapper.ID = ${targetUser!.ID}`)
                .orWhere(`testplayer.ID = ${targetUser!.ID}`)
        }) : "1 = 1")
        .andWhere(pool ? new Brackets(qb => {
            qb.where("mappool.name LIKE :criteria")
                .orWhere("mappool.abbreviation LIKE :criteria");
        }) : "1 = 1")
        .setParameters({
            tournament: tournament.ID,
            criteria: `%${pool}%`,
        })
        .getMany()).map(s => s.maps.map(m => {
            m.slot = s;
            return m;
        })).flat();

    if (mappoolMaps.length === 0) {
        if (m instanceof Message) m.reply(`No maps found${pool || targetUser ? ` with the given parameters: **${poolText ? `pool: \`${pool}\`` : ""} ${targetUser ? `user: \`${targetUser.osu.username}|${targetUser.discord.username}\`` : ""}**` : ``}`);
        else m.editReply(`No maps found${pool || targetUser ? ` with the given parameters: **${poolText ? `pool: \`${pool}\`` : ""} ${targetUser ? `user: \`${targetUser.osu.username}|${targetUser.discord.username}\`` : ""}**` : ``}`);
        return;
    }

    if (!mappoolMaps[0].slot.mappool.isPublic) {
        const securedChannel = await isSecuredChannel(m, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers, TournamentChannelType.Jobboard]);
        if (!securedChannel) 
            return;
    }

    const embed = new EmbedBuilder()
        .setTitle("Mappool Assignments")
        .setDescription(`Here are the current mappool assignments${pool || targetUser ? ` with the given parameters: **${poolText ? `pool: \`${pool}\` ` : ""}${targetUser ? `user: \`${targetUser.osu.username}|${targetUser.discord.username}\`` : ""}**` : ``}`)
        .setTimestamp(new Date())
        .setFields();

    let replied = false;
    for (const map of mappoolMaps) {
        const value = `${map.customBeatmap ? `${map.customBeatmap.artist} - ${map.customBeatmap.title} [${map.customBeatmap.difficulty}]\n` : ""}${map.customMappers.length > 0 ? `Custom Mappers: **${map.customMappers.map(u => u.osu.username).join(", ")}**\n` : ""}${map.testplayers.length > 0 ? `Testplayers: **${map.testplayers.map(u => u.osu.username).join(", ")}**\n` : ""}${map.assignedBy ? `Assigned by: **${map.assignedBy.osu.username}**\n` : ""}${map.deadline ? `Deadline: <t:${map.deadline.getTime() / 1000}:F> (<t:${map.deadline.getTime() / 1000}:R>)` : ""}`;
        if (value.length > 0)
            embed.addFields(
                {
                    name: `${map.slot.mappool.abbreviation.toUpperCase()} ${map.slot.acronym}${map.order}`,
                    value,
                    inline: true },
            );

        if (embed.data.fields!.length === 25) {
            if (!replied) {
                if (m instanceof Message) m.reply({ embeds: [embed] });
                else m.editReply({ embeds: [embed] });
                replied = true;
            } else {
                (m.channel as TextChannel).send({ embeds: [embed] });
            }
            embed.data.fields = [];
        }
    }

    if (!replied || embed.data.fields!.length > 0) {
        if (embed.data.fields!.length === 0)
            embed.addFields({ name: "No Maps Found", value: "No maps found with the given parameters."});
        
        if (m instanceof Message) m.reply({ embeds: [embed] });
        else m.editReply({ embeds: [embed] });
    }

}

const data = new SlashCommandBuilder()
    .setName("mappool_assignments")
    .setDescription("See assignments for a mapper/pool/tournament.")
    .addBooleanOption(option =>
        option.setName("include_finished")
            .setDescription("Whether to check through all (incl. finished) tournaments (applies only if command is used in DM)."))
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool see assignments of."))
    .addUserOption(option =>
        option.setName("user")
            .setDescription("The user to see assignments of."));

const mappoolAssignments: Command = {
    data,
    alternativeNames: [ "assignments_mappool", "mappool-assignments", "assignments-mappool", "mappoolassignments", "assignmentsmappool", "assignmentsp", "passignments", "pool_assignments", "assignments_pool", "pool-assignments", "assignments-pool", "poolassignments", "assignmentspool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolAssignments;