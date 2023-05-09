import { ForumChannel, ThreadChannel } from "discord.js";
import { JobPost } from "../../../Models/tournaments/mappools/jobPost";
import { discordClient } from "../../discord";
import { mappoolLog } from "../../../DiscordBot/functions/tournamentFunctions";
import { Tournament } from "../../../Models/tournaments/tournament";
import { MappoolMap } from "../../../Models/tournaments/mappools/mappoolMap";

export default async function execute () {
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
        if (job.jobBoardThread) {
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
                    mappoolLog(tournament, "jobCron", tournament.organizer, `Closed job board post for **${thread.name}** <#${thread.id}>.`);
            }
        }
        map.jobPost = null;
        await map.save();
        await job.remove();
    }
}