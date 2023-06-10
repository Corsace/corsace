import { CronJobData, CronJobType } from "../../../Interfaces/cron";
import { Tournament, TournamentStatus } from "../../../Models/tournaments/tournament";

async function initialize (): Promise<CronJobData[]> {
    // Get all tournament registration starts
    const dates: { registrationsStart: Date }[] = await Tournament
        .createQueryBuilder("tournament")
        .select("distinct registrationsStart")
        .getRawMany();

    // For each date, create a cron job with the start as the date.
    let cronJobs: CronJobData[] = dates.map(date => ({
        type: CronJobType.TournamentRegistrationStart,
        date: date.registrationsStart,
    }));

    // If any dates are in the past, remove them and add a job to start instantly.
    if (cronJobs.some(j => j.date.getTime() < Date.now())) {
        cronJobs = cronJobs.filter(j => j.date.getTime() > Date.now());
        cronJobs.push({
            type: CronJobType.Jobboard,
            date: new Date(Date.now() + 60 * 1000), // 1 minute delay to avoid Date in past error
        });
    }

    return cronJobs;
}

async function execute (job: CronJobData) {
    // Get all tournaments where their registration start has passed and their current status is NotStarted
    const tournaments = await Tournament
        .createQueryBuilder("tournament")
        .where("tournament.registrationsStart <= :date", { date: job.date })
        .andWhere("tournament.status = 0")
        .getMany();

    // For each tournament, set their status to registrations
    await Promise.all(tournaments.map(t => {
        t.status = TournamentStatus.Registrations;
        return t.save();
    }));
}

export default {
    initialize,
    execute,
};