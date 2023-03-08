import { Message, EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../index";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { fetchStaff, fetchTournament, hasTournamentRoles, isSecuredChannel } from "../../../functions/tournamentFunctions";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { MappoolSlot } from "../../../../Models/tournaments/mappools/mappoolSlot";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";

async function run (m: Message | ChatInputCommandInteraction) {
    const tournament = await fetchTournament(m, []);
    if (!tournament)
        return;

    // Check if user is a mappooler or organizer
    const allowed = await hasTournamentRoles(m, tournament, [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers]);
    if (!allowed)
        return;
    const securedChannel = await isSecuredChannel(m, tournament, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.MappoolLog, TournamentChannelType.MappoolQA, TournamentChannelType.Testplayers]);
    if (!securedChannel)
        return;

    // Get specific pool and user
    const userRegex = /-u (\S+)/;
    const poolRegex = /-p (\S+)/;
    const userText = m instanceof Message ? m.content.match(userRegex) ?? m.content.split(" ")[1] : m.options.getUser("user")?.id;
    const poolText = m instanceof Message ? m.content.match(poolRegex) ?? m.content.split(" ")[2] : m.options.getString("pool");
    if (!poolText || !userText) {
        m.reply("Missing parameters. Please use `-u <username/discord id> -p <pool> ` or `<username/discord id> <pool>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const pool = typeof poolText === "string" ? poolText : poolText[0];
    const target = typeof userText === "string" ? userText : userText[0];
    if (!target) {
        m.reply("Missing parameters. Please use `-p <pool> -u <username/discord id>` or `<pool> <username/discord id>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const user = await fetchStaff(m, tournament, target, [TournamentRoleType.Mappers, TournamentRoleType.Mappoolers, TournamentRoleType.Organizer]);
    if (!user)
        return;

    const mappools = await Mappool.search(tournament, pool);
    const mappoolMaps: MappoolMap[] = [];
    for (const mappool of mappools) {
        const slotMods = await MappoolSlot
            .createQueryBuilder("slot")
            .leftJoinAndSelect("slot.mappool", "mappool")
            .leftJoinAndSelect("slot.maps", "maps")
            .leftJoinAndSelect("maps.beatmap", "beatmap")
            .leftJoinAndSelect("maps.customMappers", "users")
            .where("mappool.ID = :mappool")
            .andWhere("users.ID = :user")
            .setParameters({
                mappool: mappool.ID,
                user: user.ID,
            })
            .getMany();

        mappoolMaps.push(...slotMods.map(m => m.maps).flat());
    }

    if (mappoolMaps.length === 0) {
        m.reply("No maps found for this user.");
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle("Mappool Assignments")
        .setDescription("Here are the current mappool assignments for this tournament.")
        .setTimestamp(new Date())
        .setFields();

    for (const map of mappoolMaps) {
        embed.addFields(
            { name: "Map", value: map.beatmap.toString(), inline: true },
        );

        if (embed.data.fields!.length === 25) {
            m.reply({ embeds: [embed] });
            embed.data.fields = [];
        }
    }    
}

const data = new SlashCommandBuilder()
    .setName("mappool_assignments")
    .setDescription("See assignments for a specific mapper.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to assign to."))
    .addUserOption(option =>
        option.setName("user")
            .setDescription("The user to assign."))
    .setDMPermission(false);

const mappoolAssignments: Command = {
    data,
    alternativeNames: [ "assignments_mappool", "mappool-assignments", "assignments-mappool", "mappoolassignments", "assignmentsmappool", "assignmentsp", "passignments", "pool_assignments", "assignments_pool", "pool-assignments", "assignments-pool", "poolassignments", "assignmentspool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolAssignments;