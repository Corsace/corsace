import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../index";
import { fetchJobThread, fetchMappool, fetchTournament, hasTournamentRoles, isSecuredChannel } from "../../../../functions/tournamentFunctions";
import { TournamentChannelType } from "../../../../../Models/tournaments/tournamentChannel";
import { TournamentRoleType } from "../../../../../Models/tournaments/tournamentRole";

async function run (m: Message | ChatInputCommandInteraction) {
    if (!m.guild)
        return;

    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const securedChannel = await isSecuredChannel(m, [TournamentChannelType.Admin]);
    if (!securedChannel)
        return;

    const tournament = await fetchTournament(m);
    if (!tournament) 
        return;

    const allowed = await hasTournamentRoles(m, tournament, [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers]);
    if (!allowed) 
        return;

    const forumChannel = await fetchJobThread(m, tournament);
    if (!forumChannel)
        return;

    const poolRegex = /-p (\S+)/;
    const endTimeRegex = /-e (\S+)/;
    const poolText = m instanceof Message ? m.content.match(poolRegex) ?? m.content.split(" ")[1] : m.options.getString("pool");
    const endTimeText = m instanceof Message ? m.content.match(endTimeRegex) ?? m.content.split(" ")[2] : m.options.getString("end_time");
    if (!poolText || !endTimeText) {
        if (m instanceof Message) m.reply("Missing parameters. Please use `-p <pool> -e <end_time>` or `<pool> <end_time>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        else m.editReply("Missing parameters. Please use `/job_publish <pool> <end_time>`.");
        return;
    }

    const pool = typeof poolText === "string" ? poolText : poolText[1];
    const endTimeString = typeof endTimeText === "string" ? endTimeText : endTimeText[1];
    const endTime = new Date(endTimeString.includes("-") ? endTimeString : parseInt(endTimeString + "000"));
    if (isNaN(endTime.getTime()) || endTime.getTime() < Date.now()) {
        if (m instanceof Message) m.reply("Invalid end time. Please use `-p <pool> -e <end_time>` or `<pool> <end_time>`. If you do not use the `-` prefixes, the order of the parameters is important.");
        else m.editReply("Invalid end time. Please use `/job_publish <pool> <end_time>`.");
        return;
    }

    const mappool = await fetchMappool(m, tournament, pool, false, true, true);
    if (!mappool) 
        return;

    const totalThreadCount = mappool.slots.map(slot => slot.maps).flat().filter(map => map.jobPost && !map.jobPost.jobBoardThread).length;
    let content = `Generating ${totalThreadCount} threads for ${mappool.abbreviation.toUpperCase()}.\n`;
    let counter = 0;
    const threadMessage = m instanceof Message ? await m.reply(content) : await m.editReply(content);

    for (const slot of mappool.slots)
        for (const map of slot.maps) {
            if (map.jobPost && !map.jobPost.jobBoardThread) {
                const jobBoardThread = await forumChannel.threads.create({
                    name: `${mappool.abbreviation.toUpperCase()} ${slot.acronym.toUpperCase()}${map.order}`,
                    message: { content: map.jobPost.description },
                    appliedTags: [forumChannel.availableTags.find(t => t.name.toLowerCase() === "open")?.id ?? ""],
                });
                const starter = await jobBoardThread.fetchStarterMessage();
                await starter?.pin();

                map.jobPost.jobBoardThread = jobBoardThread.id;
                map.jobPost.deadline = endTime;
                await map.jobPost.save();

                counter++;
                content += `Created thread for ${mappool.abbreviation.toUpperCase()} - ${slot.acronym.toUpperCase()}${map.order}. ${counter}/${totalThreadCount}\n`;
                await threadMessage.edit(content);
            }
        }

    content += "\nCreated all threads. You can close threads and assign mappers using `mappool_assign`.";
    await threadMessage.edit(content);
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

const jobPublish: Command = {
    data,
    alternativeNames: [ "publish_job", "job-publish", "publish-job", "jobpublish", "publishjob", "publishj", "jpublish", "job_pub", "pub_job", "job-pub", "pub-job", "jobpub", "pubjob", "pubj", "jpub" ],
    category: "tournaments",
    subCategory: "mappools/jobs",
    run,
};

export default jobPublish;