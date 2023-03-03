import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { fetchMappool, fetchSlot, fetchTournament, hasTournamentRoles, isSecuredChannel } from "../../../functions/tournamentFunctions";
import { Command } from "../../index";

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

    const poolRegex = /-p (\S+)/;
    const slotRegex = /-s (\S+)/;
    const dateRegex = /-d ((\d|-)+ ?(\d|:)*)/;
    const poolText = m instanceof Message ? m.content.match(poolRegex) ?? m.content.split(" ")[1] : m.options.getString("pool");
    const slotText = m instanceof Message ? m.content.match(slotRegex) ?? m.content.split(" ")[2] : m.options.getString("slot");
    const dateText = m instanceof Message ? m.content.match(dateRegex) ?? m.content.split(" ")[3] : m.options.getString("date");
    if (!poolText || !slotText || !dateText) {
        m.reply("Missing parameters. Please use `-p <pool> -s <slot> -d <date>` or `<pool> <slot> <date>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const date = new Date(typeof dateText === "string" ? dateText : dateText[0]);
    const pool = typeof poolText === "string" ? poolText : poolText[0];
    const order = parseInt(typeof slotText === "string" ? slotText.substring(slotText.length - 1) : slotText[0].substring(slotText[0].length - 1));
    const slot = parseInt(typeof slotText === "string" ? slotText.substring(0, slotText.length - 1) : slotText[0].substring(0, slotText[0].length - 1));
    if (!pool || !slot || isNaN(date.getTime()) || !order) {
        m.reply("Missing parameters. Please use `-p <pool> -s <slot> -d <date>` or `<pool> <slot> <date>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }
    if (isNaN(order)) {
        m.reply("Invalid slot number. Please use a valid slot number.");
        return;
    }

    const mappool = await fetchMappool(m, tournament, pool);
    if (!mappool)
        return;

    const slotMod = await fetchSlot(m, mappool, slot.toString(), true);
    if (!slotMod)
        return;

    const mappoolMap = slotMod.maps.find(m => m.order === order);
    if (!mappoolMap) {
        m.reply(`Could not find **${slot}${order}**`);
        return;
    }
    if (!mappoolMap.customMappers || mappoolMap.customMappers.length === 0) {
        m.reply(`**${slot}${order}** does not have any custom mappers`);
        return;
    }

    mappoolMap.deadline = date;
    await mappool.save();

    m.reply(`Set deadline for **${slot}${order}** to **${date.toUTCString()}**`);
}

const data = new SlashCommandBuilder()
    .setName("mappool_deadline")
    .setDescription("Set a deadline for a slot in a mappool")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to set the deadline for")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("slot")
            .setDescription("The slot to set the deadline for")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("date")
            .setDescription("The date (and time) to set the deadline for")
            .setRequired(true))
    .setDMPermission(false);  

const mappoolDeadline: Command = {
    data,
    alternativeNames: [ "deadline_mappool", "mappool-deadline", "deadline-mappool", "mappooldeadline", "deadlinemappool", "deadlinesp", "pdeadline", "pool_deadline", "deadline_pool", "pool-deadline", "deadline-pool", "pooldeadline", "deadlinepool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolDeadline;