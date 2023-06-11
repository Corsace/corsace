import { CronJobData, CronJobType } from "../../../Interfaces/cron";
import { Tournament, TournamentStatus } from "../../../Models/tournaments/tournament";

async function initialize (): Promise<CronJobData[]> {
    // Get all tournament registration ends
    const dates: { registrationsEnd: Date }[] = await Tournament
        .createQueryBuilder("tournament")
        .select("distinct registrationsEnd")
        .getRawMany();

    // For each date, create a cron job with the end as the date.
    let cronJobs: CronJobData[] = dates.map(date => ({
        type: CronJobType.TournamentRegistrationEnd,
        date: date.registrationsEnd,
    }));

    // If any dates are in the past, remove them and add a job to start instantly.
    if (cronJobs.some(j => j.date.getTime() < Date.now())) {
        cronJobs = cronJobs.filter(j => j.date.getTime() > Date.now());
        cronJobs.push({
            type: CronJobType.TournamentRegistrationEnd,
            date: new Date(Date.now() + 60 * 1000), // 1 minute delay to avoid Date in past error
        });
    }

    return cronJobs;
}

async function execute (job: CronJobData) {
    // Get all tournaments where their registration end has passed and their current status is registrations
    const tournaments = await Tournament
        .createQueryBuilder("tournament")
        .where("tournament.registrationsEnd <= :date", { date: job.date })
        .andWhere("tournament.status <= 1")
        .getMany();

    // For each tournament, set their status to ongoing
    await Promise.all(tournaments.map(t => {
        t.status = TournamentStatus.Ongoing;
        return t.save();
    }));
}

export default {
    initialize,
    execute,
};