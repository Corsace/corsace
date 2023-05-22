import { Message, EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, TextChannel } from "discord.js";
import { Command } from "../../index";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { Brackets } from "typeorm";
import { loginResponse } from "../../../functions/loginResponse";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { extractParameters } from "../../../functions/parameterFunctions";
import { extractTargetText } from "../../../functions/tournamentFunctions/paramaterExtractionFunctions";
import getUser from "../../../functions/dbFunctions/getUser";
import commandUser from "../../../functions/commandUser";
import respond from "../../../functions/respond";
import getStaff from "../../../functions/tournamentFunctions/getStaff";
import getTournament from "../../../functions/tournamentFunctions/getTournament";

async function assignmentListDM(m: Message | ChatInputCommandInteraction) {
    // Check if they had -incfin in their text, or if they said true for the include_finished option in the slash command
    const all = m instanceof Message ? m.content.includes("-incfin") : m.options.getBoolean("include_finished");

    // Get all mappoolMaps the user is assigned to, and get all the tournaments they are in
    const user = await getUser(commandUser(m).id, "discord", false);
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
        await respond(m, "No maps found for this user.")
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
                await respond(m, undefined, [embed]);
                replied = true;
            } else {
                await (m.channel as TextChannel).send({ embeds: [embed] });
            }
            embed.data.fields = [];
        }
    }    

    if (!replied || embed.data.fields!.length > 0) {
        if (embed.data.fields!.length === 0)
            embed.addFields({ name: "No Maps Found", value: "No maps found with the given parameters."});
        
        await respond(m, undefined, [embed]);
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

    if (m instanceof Message ? m.content.includes("-incfin") : m.options.getBoolean("include_finished")) {
        await respond(m, "You cannot use the `all` option outside of DMs, as it shows your assignments across all pools and tournaments");
        return;
    }

    const tournament = await getTournament(m);
    if (!tournament) 
        return;

    // Get specific pool and user
    const params = extractParameters<parameters>(m, [
        { name: "pool", optional: true, regex: /-p (\S+)/, regexIndex: 1 },
        { name: "target", optional: true, customHandler: extractTargetText(2) },
    ]);
    if (!params)
        return;

    const { target, pool } = params;

    let targetUser = target ? await getStaff(m, tournament, target, [TournamentRoleType.Mappers, TournamentRoleType.Mappoolers, TournamentRoleType.Organizer]) : undefined;
    if (target && !targetUser)
        return;

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
        await respond(m, `No maps found${pool || targetUser ? ` with the given parameters: **${pool ? `pool: \`${pool}\`` : ""} ${targetUser ? `user: \`${targetUser.osu.username}|${targetUser.discord.username}\`` : ""}**` : ``}`);
        return;
    }

    if (mappoolMaps.some(m => !m.slot.mappool.isPublic) && !await securityChecks(m, true, false, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers, TournamentChannelType.Jobboard], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers]))
        return;

    const embed = new EmbedBuilder()
        .setTitle("Mappool Assignments")
        .setDescription(`Here are the current mappool assignments${pool || targetUser ? ` with the given parameters: **${pool ? `pool: \`${pool}\` ` : ""}${targetUser ? `user: \`${targetUser.osu.username}|${targetUser.discord.username}\`` : ""}**` : ``}`)
        .setTimestamp(new Date())
        .setFields();

    let replied = false;
    for (const map of mappoolMaps) {
        const beatmapText = map.customBeatmap ? `${map.customBeatmap.artist} - ${map.customBeatmap.title} [${map.customBeatmap.difficulty}]\n` : "";
        const customMappers = map.customMappers.length > 0 ? `Custom Mappers: **${map.customMappers.map(u => u.osu.username).join(", ")}**\n` : "";
        const testplayers = map.testplayers.length > 0 ? `Testplayers: **${map.testplayers.map(u => u.osu.username).join(", ")}**\n` : "";
        const assignedBy = map.assignedBy ? `Assigned by: **${map.assignedBy.osu.username}**\n` : "";
        const deadline = map.deadline ? `Deadline: <t:${map.deadline.getTime() / 1000}:F> (<t:${map.deadline.getTime() / 1000}:R>)` : "";
        const value = `${beatmapText}${customMappers}${testplayers}${assignedBy}${deadline}`;
        if (value.length > 0)
            embed.addFields(
                {
                    name: `${map.slot.mappool.abbreviation.toUpperCase()} ${map.slot.acronym}${map.order}`,
                    value,
                    inline: true },
            );

        if (embed.data.fields!.length !== 25)
            continue;

        if (!replied) {
            await respond(m, undefined, [embed]);
            replied = true;
        } else
            await (m.channel as TextChannel).send({ embeds: [embed] });
        embed.data.fields = [];
    }

    if (!replied || embed.data.fields!.length > 0) {
        if (embed.data.fields!.length === 0)
            embed.addFields({ name: "No Maps Found", value: "No maps found with the given parameters."});
        
        await replied ? respond(m, undefined, [embed]) : m.channel?.send({ embeds: [embed] });
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

interface parameters {
    target?: string,
    pool?: string,
}

const mappoolAssignments: Command = {
    data,
    alternativeNames: [ "assignments_mappool", "mappool-assignments", "assignments-mappool", "mappoolassignments", "assignmentsmappool", "assignmentsp", "passignments", "pool_assignments", "assignments_pool", "pool-assignments", "assignments-pool", "poolassignments", "assignmentspool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolAssignments;