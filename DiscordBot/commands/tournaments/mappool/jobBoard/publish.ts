import { ChatInputCommandInteraction, GuildForumThreadCreateOptions, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../index";
import { TournamentChannelType } from "../../../../../Models/tournaments/tournamentChannel";
import { TournamentRoleType } from "../../../../../Models/tournaments/tournamentRole";
import { CronJobType } from "../../../../../Interfaces/cron";
import { loginResponse } from "../../../../functions/loginResponse";
import { cron } from "../../../../../Server/cron";
import { securityChecks } from "../../../../functions/tournamentFunctions/securityChecks";
import getJobForum from "../../../../functions/tournamentFunctions/getJobForum";
import getUser from "../../../../functions/dbFunctions/getUser";
import commandUser from "../../../../functions/commandUser";
import respond from "../../../../functions/respond";
import mappoolLog from "../../../../functions/tournamentFunctions/mappoolLog";
import { extractParameters } from "../../../../functions/parameterFunctions";
import { extractDate } from "../../../../functions/tournamentFunctions/paramaterExtractionFunctions";
import mappoolComponents from "../../../../functions/tournamentFunctions/mappoolComponents";
import { unFinishedTournaments } from "../../../../../Models/tournaments/tournament";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, false, [TournamentChannelType.Admin], [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]))
        return;

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const params = extractParameters<parameters>(m, [
        { name: "pool", regex: /-p (\S+)/, regexIndex: 1 },
        { name: "end_time", customHandler: extractDate(2)  },
    ]);
    if (!params)
        return;

    const { pool, end_time } = params;
    if (isNaN(end_time.getTime()) || end_time.getTime() < Date.now()) {
        await respond(m, "Invalid end time. Please use `-p <pool> -e <end_time>` or `<pool> <end_time>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        return;
    }

    const components = await mappoolComponents(m, pool, true, true, true, { text: m.channelId, searchType: "channel"}, unFinishedTournaments, false, undefined, true);
    if (!components || !("mappool" in components))
        return;

    const { tournament, mappool } = components;

    const totalThreadCount = mappool.slots.map(slot => slot.maps).flat().filter(map => map.jobPost && !map.jobPost.jobBoardThread).length;
    if (totalThreadCount === 0) {
        await respond(m, "No job board posts to publish.");
        return;
    }

    try {
        await cron.add(CronJobType.Jobboard, end_time);
    } catch (err) {
        m.channel?.send(`Failed to get cron job running to close job board posts on time. Please contact VINXIS.`);
        console.log(err);
        return;
    }

    let content = `Generating ${totalThreadCount} threads for ${mappool.abbreviation.toUpperCase()}.\n`;
    let logText = "";
    let counter = 0;
    const threadMessage = await respond(m, content);

    const forumChannel = await getJobForum(m, tournament);
    if (!forumChannel)
        return;

    for (const slot of mappool.slots)
        for (const map of slot.maps) {
            if (map.jobPost && !map.jobPost.jobBoardThread) {
                const createObj: GuildForumThreadCreateOptions = {
                    name: `${mappool.abbreviation.toUpperCase()} ${slot.acronym.toUpperCase()}${map.order}`,
                    message: { content: map.jobPost.description },
                }
                const tag = forumChannel.availableTags.find(t => t.name.toLowerCase() === "open")?.id;
                if (tag)
                    createObj.appliedTags = [tag];
                const jobBoardThread = await forumChannel.threads.create(createObj);
                const starter = await jobBoardThread.fetchStarterMessage();
                await starter?.pin();

                map.jobPost.jobBoardThread = jobBoardThread.id;
                map.jobPost.deadline = end_time;
                await map.jobPost.save();

                counter++;
                content += `Created thread for **${mappool.abbreviation.toUpperCase()} ${slot.acronym.toUpperCase()}${map.order}**. ${counter}/${totalThreadCount}\n`;
                logText += `Created thread for \`${mappool.abbreviation.toUpperCase()} ${slot.acronym.toUpperCase()}${map.order}\` <#${jobBoardThread.id}>.\n`;
                await threadMessage.edit(content);
            }
        }

    content += "\nCreated all threads. You can close threads and assign mappers using `mappool_assign`.";
    await threadMessage.edit(content);

    await mappoolLog(tournament, "jobPublish", user, logText);
}

const data = new SlashCommandBuilder()
    .setName("job_publish")
    .setDescription("Publish a slot's job board post to a job board forum.")
    .addStringOption(option =>
        option.setName("pool")
            .setDescription("The mappool to publish the job board post for.")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("end_time")
            .setDescription("Job board post's publish end date in YYYY-MM-DD or unix/epoch format (e.g. 2024-01-02 or 1704178800)")
            .setRequired(true))
    .setDMPermission(false);

interface parameters {
    pool: string,
    end_time: Date,
}

const jobPublish: Command = {
    data,
    alternativeNames: [ "publish_job", "job-publish", "publish-job", "jobpublish", "publishjob", "publishj", "jpublish", "job_pub", "pub_job", "job-pub", "pub-job", "jobpub", "pubjob", "pubj", "jpub" ],
    category: "tournaments",
    subCategory: "mappools/jobs",
    run,
};

export default jobPublish;