import { CronJobData, CronJobType } from "../../../Interfaces/cron";
import { Matchup, preInviteTime } from "../../../Models/tournaments/matchup";
import { config } from "node-config-ts";
import Axios from "axios";

async function initialize (): Promise<CronJobData[]> {
    // Get all tournament registration ends
    const dates: { date: Date }[] = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .select("distinct matchup.date")
        .where("stage.stageType = '0'")
        .andWhere("matchup.mp IS NULL")
        .getRawMany();

    // For each date, create a cron job with the end as the date.
    let cronJobs: CronJobData[] = dates.map(date => ({
        type: CronJobType.QualifierMatchup,
        date: new Date(date.date.getTime() - preInviteTime), // Go back preInviteTime to allow for invites to be sent before matchup starts
    }));

    // If any dates are in the past, remove them and add a job to start instantly.
    if (cronJobs.some(j => j.date.getTime() < Date.now())) {
        cronJobs = cronJobs.filter(j => j.date.getTime() > Date.now());
        cronJobs.push({
            type: CronJobType.QualifierMatchup,
            date: new Date(Date.now() + 10 * 1000), // 10 second delay to avoid Date in past error
        });
    }

    return cronJobs;
}

async function execute (job: CronJobData) {
    const { data } = await Axios.post(`${config.banchoBot.publicUrl}/api/bancho/runMatchups`, {
        time: job.date.getTime(),
    }, {
        auth: config.interOpAuth,
    });
    if (data.success)
        return;

    console.log("Error starting matchup cron execution");
    console.log(data);
}

export default {
    initialize,
    execute,
};
