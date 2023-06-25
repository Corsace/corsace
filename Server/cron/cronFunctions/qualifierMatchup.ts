import { CronJobData, CronJobType } from "../../../Interfaces/cron";
import { Matchup } from "../../../Models/tournaments/matchup";
import { discordClient } from "../../discord";
import { config } from "node-config-ts";
import { TextChannel } from "discord.js";
import runMatch from "../../../BanchoBot/tournaments/runMatch";

async function initialize (): Promise<CronJobData[]> {
    // Get all tournament registration ends
    const dates: { date: Date }[] = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .select("distinct matchup.date")
        .where("stage.stageType = 0")
        .getRawMany();

    // For each date, create a cron job with the end as the date.
    let cronJobs: CronJobData[] = dates.map(date => ({
        type: CronJobType.QualifierMatchup,
        date: new Date(date.date.getTime() - 15 * 60 * 1000), // Go back 15 minutes
    }));

    // If any dates are in the past, remove them and add a job to start instantly.
    if (cronJobs.some(j => j.date.getTime() < Date.now())) {
        cronJobs = cronJobs.filter(j => j.date.getTime() > Date.now());
        cronJobs.push({
            type: CronJobType.QualifierMatchup,
            date: new Date(Date.now() + 60 * 1000), // 1 minute delay to avoid Date in past error
        });
    }

    return cronJobs;
}

async function execute (job: CronJobData) {
    const futureDate = new Date(job.date.getTime() + 15 * 60 * 1000);

    // Get all matchups that are in the past and have not been played
    const matchups = await Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.teams", "team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .where("matchup.date <= :now", { now: futureDate })
        .andWhere("matchup.mp IS NULL")
        .getMany();

    matchups.forEach(matchup => {
        runMatch(matchup).catch(err => {
            if (err) {
                console.log(err);
                const channel = discordClient.channels.cache.get(config.discord.coreChannel);
                if (channel instanceof TextChannel)
                    channel.send(`Error running match: ${err}`);
            }
        });
    });
}

export default {
    initialize,
    execute,
};
