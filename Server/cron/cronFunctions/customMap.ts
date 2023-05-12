import { ForumChannel, ThreadChannel } from "discord.js";
import { discordClient } from "../../discord";
import { MappoolMap } from "../../../Models/tournaments/mappools/mappoolMap";
import { Tournament } from "../../../Models/tournaments/tournament";
import { mappoolLog } from "../../../DiscordBot/functions/tournamentFunctions";
import { CronJobData, CronJobType } from "../../../Interfaces/cron";

async function initialize (): Promise<CronJobData[]> {
    // Get all maps with a deadline
    const maps: { deadline: Date }[] = await MappoolMap
        .createQueryBuilder("map")
        .select("distinct deadline")
        .where("map.deadline IS NOT NULL")
        .getRawMany();

    // For each map, create a cron job with the deadline as the date.
    let cronJobs: CronJobData[] = maps.map(map => ({
        type: CronJobType.Custommap,
        date: map.deadline!,
    })).filter((j, i, a) => a.findIndex(j2 => j2.date.getTime() === j.date.getTime()) === i);

    if (cronJobs.some(j => j.date.getTime() < Date.now())) {
        await execute();
        cronJobs = cronJobs.filter(j => j.date.getTime() > Date.now());
    }

    return cronJobs;
}

async function execute () {
    // Get all mappoolMaps where their deadline has passed.
    const maps = await MappoolMap
        .createQueryBuilder("map")
        .where("map.deadline <= :date", { date: new Date() })
        .getMany();

    // For each job, add the Late tag to QA their respective QA thread, and remove the deadline from the database.
    const tournaments: Tournament[] = [];
    for (const map of maps) {
        if (map.customThreadID) {
            const thread = await discordClient.channels.fetch(map.customThreadID) as ThreadChannel | null;
            if (thread) {
                const forumChannel = thread.parent as ForumChannel;
                const tag = forumChannel.availableTags.find(t => t.name.toLowerCase() === "late")?.id;
                if (tag) await thread.setAppliedTags([...thread.appliedTags, tag], "The deadline for this beatmap has now passed.");

                const tournament = tournaments.find(t => t.server === thread.guildId) || await Tournament
                    .createQueryBuilder("tournament")
                    .leftJoinAndSelect("tournament.organizer", "organizer")
                    .leftJoinAndSelect("tournament.mode", "mode")
                    .where("tournament.server = :server", { server: thread.guildId })
                    .getOne();

                if (tournament)
                    mappoolLog(tournament, "customMapCron", tournament.organizer, `Applied the \`late\` tag for **${thread.name}** <#${thread.id}>.`);
            }
        }

        map.deadline = null;
        await map.save();
    }
}

export default {
    initialize,
    execute,
}