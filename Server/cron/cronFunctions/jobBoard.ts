import { DiscordAPIError, ForumChannel, ThreadChannel } from "discord.js";
import { JobPost } from "../../../Models/tournaments/mappools/jobPost";
import { discordClient } from "../../discord";
import { Tournament } from "../../../Models/tournaments/tournament";
import { MappoolMap } from "../../../Models/tournaments/mappools/mappoolMap";
import { CronJobData, CronJobType } from "../../../Interfaces/cron";
import mappoolLog from "../../../DiscordBot/functions/tournamentFunctions/mappoolLog";

async function initialize (): Promise<CronJobData[]> {
    // Get all job posts with a deadline
    const jobs: { deadline: Date }[] = await JobPost
        .createQueryBuilder("jobPost")
        .select("distinct deadline")
        .where("jobPost.deadline IS NOT NULL")
        .getRawMany();

    // For each job post, create a cron job with the deadline as the date.
    let cronJobs: CronJobData[] = jobs.map(job => ({
        type: CronJobType.Jobboard,
        date: job.deadline!,
    }));

    // If any dates are in the past, remove them and add a job to start instantly.
    if (cronJobs.some(j => j.date.getTime() < Date.now())) {
        cronJobs = cronJobs.filter(j => j.date.getTime() > Date.now());
        cronJobs.push({
            type: CronJobType.Jobboard,
            date: new Date(Date.now() + 1000), // 1 second delay to avoid Date in past error
        });
    }

    return cronJobs;
}

async function execute () {
    // Get all jobs where their deadline has passed
    const maps = await MappoolMap
        .createQueryBuilder("map")
        .leftJoinAndSelect("map.jobPost", "jobPost")
        .where("jobPost.deadline <= :date", { date: new Date() })
        .getMany();

    // For each job, add To Assign and Closed tags to the thread, close the thread, and remove the job from the database
    const tournaments: Tournament[] = [];
    for (const map of maps) {
        if (!map.jobPost) continue;

        const job = map.jobPost;
        map.jobPost = null;
        await map.save();
        await job.remove();

        if (!job.jobBoardThread)
            continue;
        
        try {
            const thread = await discordClient.channels.fetch(job.jobBoardThread) as ThreadChannel | null;
            if (thread) {
                const forumChannel = thread.parent as ForumChannel;
                const closedTag = forumChannel.availableTags.find(t => t.name.toLowerCase() === "closed")?.id;
                const toAssignTag = forumChannel.availableTags.find(t => t.name.toLowerCase() === "to assign")?.id;
                const tags = [closedTag, toAssignTag].filter(t => t) as string[];
                await thread.setAppliedTags(tags, "This slot is now assigned.");
                await thread.setArchived(true, "This slot is now assigned.");

                const tournament = tournaments.find(t => t.server === thread.guildId) || await Tournament
                    .createQueryBuilder("tournament")
                    .leftJoinAndSelect("tournament.organizer", "organizer")
                    .leftJoinAndSelect("tournament.mode", "mode")
                    .where("tournament.server = :server", { server: thread.guildId })
                    .getOne();

                if (tournament)
                    mappoolLog(tournament, "jobCron", tournament.organizer, `Closed job board post for \`${thread.name}\``);
            }
        } catch (err) {
            if (!(err instanceof DiscordAPIError && err.code === 10003))
                console.error(err);
        }
    }
}

export default {
    initialize,
    execute,
}