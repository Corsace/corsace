import { ChatInputCommandInteraction, ForumChannel, Message, SlashCommandBuilder } from "discord.js";
import { TournamentChannelType } from "../../../../Models/tournaments/tournamentChannel";
import { TournamentRoleType } from "../../../../Models/tournaments/tournamentRole";
import { Command } from "../../index";
import { loginResponse } from "../../../functions/loginResponse";
import { CronJobType } from "../../../../Interfaces/cron";
import { cron } from "../../../../Server/cron";
import { unFinishedTournaments } from "../../../../Models/tournaments/tournament";
import { extractParameters } from "../../../functions/parameterFunctions";
import { postProcessSlotOrder } from "../../../functions/tournamentFunctions/parameterPostProcessFunctions";
import { extractDate } from "../../../functions/tournamentFunctions/paramaterExtractionFunctions";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import getUser from "../../../functions/dbFunctions/getUser";
import commandUser from "../../../functions/commandUser";
import respond from "../../../functions/respond";
import mappoolLog from "../../../functions/tournamentFunctions/mappoolLog";
import getCustomThread from "../../../functions/tournamentFunctions/getCustomThread";
import mappoolComponents from "../../../functions/tournamentFunctions/mappoolComponents";
import channelID from "../../../functions/channelID";
import { discordStringTimestamp } from "../../../../Server/utils/dateParse";

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

    const params = extractParameters<parameters>(m, [
        { name: "pool", paramType: "string" },
        { name: "slot", paramType: "string", postProcess: postProcessSlotOrder },
        { name: "date", paramType: "string", customHandler: extractDate  },
    ]);
    if (!params)
        return;
    const { pool, slot, order, date } = params;
    if (isNaN(date.getTime()) || date.getTime() < (Date.now() + 60000)) {
        await respond(m, "Invalid date. Provide a valid date using either `YYYY-MM-DD` format, or a unix/epoch timestamp in seconds, and also don't be stupid as hell and make the deadline within the next minute.\n\nUnix timestamps can be found [here](https://www.unixtimestamp.com/)");
        return;
    }

    const components = await mappoolComponents(m, pool, slot, order || true, true, { text: channelID(m), searchType: "channel"}, unFinishedTournaments, true);
    if (!components || !("mappoolMap" in components) || !("stage" in components)) {
        if (components && "slotMod" in components)
            await respond(m, "Invalid slot");
        return;
    }
    const { tournament, stage, mappoolMap, mappoolSlot } = components;

    if (stage!.timespan.start.getTime() < date.getTime()) {
        await respond(m, "The deadline cannot be after the start of the stage. That literally makes no sense????/");
        return;
    }

    if (!mappoolMap.customMappers || mappoolMap.customMappers.length === 0) {
        await respond(m, `**${mappoolSlot}** doesn't have any custom mappers`);
        return;
    }

    mappoolMap.deadline = date;

    try {
        await cron.add(CronJobType.Custommap, date);
    } catch (err) {
        await respond(m, `Failed to get cron job running to apply changes at deadline. Contact VINXIS`);
        console.log(err);
        return;
    }

    const customThread = await getCustomThread(m, mappoolMap, tournament, mappoolSlot);
    if (!customThread)
        return;
    if (customThread !== true && m.channel?.id !== customThread[0].id) {
        const [thread] = customThread;
        const forumChannel = thread.parent as ForumChannel;
        await thread.send(`**${mappoolMap.customMappers.map(c => `<@${c.discord.userID}>`).join(" ")} ATTENTION**\n<@${user.discord.userID}> has added a deadline: **${discordStringTimestamp(date)}**`);
        const lateTag = forumChannel.availableTags.find(t => t.name.toLowerCase() === "late");
        if (lateTag) await thread.setAppliedTags(thread.appliedTags.filter(t => t !== lateTag.id));
    }

    await mappoolMap.save();

    await respond(m, `Deadline for **${mappoolSlot}** set to **${discordStringTimestamp(date)}**`);

    await mappoolLog(tournament, "deadline", user, `Deadline for \`${mappoolSlot}\` set to ${discordStringTimestamp(date)}`);
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

interface parameters {
    pool: string,
    slot: string,
    order?: number,
    date: Date,
}

const mappoolDeadline: Command = {
    data,
    alternativeNames: [ "deadline_mappool", "mappool-deadline", "deadline-mappool", "mappooldeadline", "deadlinemappool", "deadlinep", "pdeadline", "pool_deadline", "deadline_pool", "pool-deadline", "deadline-pool", "pooldeadline", "deadlinepool", "mappool_dd", "dd_mappool", "mappool-dd", "dd-mappool", "mappooldd", "ddmappool", "ddp", "pdd", "pool_dd", "dd_pool", "pool-dd", "dd-pool", "pooldd", "ddpool" ],
    category: "tournaments",
    subCategory: "mappools",
    run,
};

export default mappoolDeadline;