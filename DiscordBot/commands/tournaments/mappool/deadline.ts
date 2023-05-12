import Axios from "axios";
import { config } from "node-config-ts";
import { ChatInputCommandInteraction, ForumChannel, Message, SlashCommandBuilder } from "discord.js";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { fetchCustomThread, fetchMappool, fetchSlot, fetchTournament, hasTournamentRoles, isSecuredChannel, mappoolLog } from "../../../functions/tournamentFunctions";
import { Command } from "../../index";
import { User } from "../../../../Models/user";
import { loginResponse } from "../../../functions/loginResponse";
import { CronJobType } from "../../../../Interfaces/cron";
import { cron } from "../../../../Server/cron";

async function run (m: Message | ChatInputCommandInteraction) {
    if (!m.guild)
        return;

    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const securedChannel = await isSecuredChannel(m, [TournamentChannelType.Admin, TournamentChannelType.Mappool, TournamentChannelType.Mappoollog, TournamentChannelType.Mappoolqa, TournamentChannelType.Testplayers, TournamentChannelType.Jobboard]);
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
    })
    if (!user) {
        await loginResponse(m);
        return;
    }

    const poolRegex = /-p (\S+)/;
    const slotRegex = /-s (\S+)/;
    const dateRegex = new RegExp(/-r ((?:\d{4}-\d{2}-\d{2})|\d{10})/);
    const poolText = m instanceof Message ? m.content.match(poolRegex) ?? m.content.split(" ")[1] : m.options.getString("pool");
    const slotText = m instanceof Message ? m.content.match(slotRegex) ?? m.content.split(" ")[2] : m.options.getString("slot");
    const dateText = m instanceof Message ? m.content.match(dateRegex) ?? m.content.split(" ")[3] : m.options.getString("date");
    if (!poolText || !slotText || !dateText) {
        if (m instanceof Message) m.reply("Missing parameters. Please use `-p <pool> -s <slot> -d <date>` or `<pool> <slot> <date>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        else m.editReply("Missing parameters. Please use `-p <pool> -s <slot> -d <date>` or `<pool> <slot> <date>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const date = new Date(typeof dateText === "string" ? dateText.includes("-") ? dateText : parseInt(dateText + "000") : dateText[1].includes("-") ? dateText[1] : parseInt(dateText[1] + "000"));
    const pool = typeof poolText === "string" ? poolText : poolText[0];
    const order = parseInt(typeof slotText === "string" ? slotText.substring(slotText.length - 1) : slotText[1].substring(slotText[1].length - 1));
    const slot = (typeof slotText === "string" ? slotText.substring(0, slotText.length - 1) : slotText[1].substring(0, slotText[1].length - 1)).toUpperCase();

    if (isNaN(date.getTime()) || date.getTime() < Date.now()) {
        if (m instanceof Message) m.reply("Invalid date. Please provide a valid date using either `YYYY-MM-DD` format, or a unix/epoch timestamp in seconds.\n\nUnix timestamps can be found [here](https://www.unixtimestamp.com/).");
        else m.editReply("Invalid date. Please provide a valid date using either `YYYY-MM-DD` format, or a unix/epoch timestamp in seconds.\n\nUnix timestamps can be found [here](https://www.unixtimestamp.com/).");
        return;
    }
    if (isNaN(order)) {
        if (m instanceof Message) m.reply(`Invalid slot number **${order}**. Please use a valid slot number.`);
        else m.editReply(`Invalid slot number **${order}**. Please use a valid slot number.`);
        return;
    }

    const mappool = await fetchMappool(m, tournament, pool, true);
    if (!mappool) 
        return;

    if (mappool.stage.timespan.start.getTime() < date.getTime()) {
        if (m instanceof Message) m.reply("The deadline cannot be after the start of the stage. That literally makes no sense.");
        else m.editReply("The deadline cannot be after the start of the stage. That literally makes no sense.");
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
    if (!mappoolMap.customMappers || mappoolMap.customMappers.length === 0) {
        if (m instanceof Message) m.reply(`**${mappoolSlot}** does not have any custom mappers`);
        else m.editReply(`**${mappoolSlot}** does not have any custom mappers`);
        return;
    }

    mappoolMap.deadline = date;

    try {
        await cron.add(CronJobType.Custommap, date);
    } catch (err) {
        m.channel?.send(`Failed to get cron job running to apply changes at deadline. Please contact VINXIS.`);
        console.log(err);
        return;
    }

    const customThread = await fetchCustomThread(m, mappoolMap, tournament, mappoolSlot);
    if (!customThread)
        return;
    if (customThread !== true && m.channel?.id !== customThread[0].id) {
        const [thread] = customThread;
        const forumChannel = thread.parent as ForumChannel;
        await thread.send(`<@${user.discord.userID}> has added a deadline: **<t:${date.getTime() / 1000}>**`);
        const lateTag = forumChannel.availableTags.find(t => t.name.toLowerCase() === "late");
        if (lateTag) await thread.setAppliedTags(thread.appliedTags.filter(t => t !== lateTag.id))
    }

    await mappoolMap.save();

    if (m instanceof Message) m.reply(`Deadline for **${mappoolSlot}** set to **<t:${date.getTime() / 1000}>**`);
    else m.editReply(`Deadline for **${mappoolSlot}** set to **<t:${date.getTime() / 1000}>**`);

    await mappoolLog(tournament, "deadline", user, `Deadline for **${mappoolSlot}** set to **<t:${date.getTime() / 1000}>**`);
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
    alternativeNames: [ "deadline_mappool", "mappool-deadline", "deadline-mappool", "mappooldeadline", "deadlinemappool", "deadlinep", "pdeadline", "pool_deadline", "deadline_pool", "pool-deadline", "deadline-pool", "pooldeadline", "deadlinepool", "mappool_dd", "dd_mappool", "mappool-dd", "dd-mappool", "mappooldd", "ddmappool", "ddp", "pdd", "pool_dd", "dd_pool", "pool-dd", "dd-pool", "pooldd", "ddpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolDeadline;