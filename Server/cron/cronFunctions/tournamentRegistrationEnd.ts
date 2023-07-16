import { CronJobData, CronJobType } from "../../../Interfaces/cron";
import { Tournament, TournamentStatus } from "../../../Models/tournaments/tournament";

async function initialize (): Promise<CronJobData[]> {
    // Get all tournament registration ends
    const dates: { registrationsEnd: Date }[] = await Tournament
        .createQueryBuilder("tournament")
        .select("distinct registrationsEnd")
        .where("tournament.status != '0'")
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
            date: new Date(Date.now() + 10 * 1000), // 10 second delay to avoid Date in past error
        });
    }

    return cronJobs;
}

async function execute (job: CronJobData) {
    // Get all tournaments where their registration end has passed and their current status is registrations
    const tournaments = await Tournament
        .createQueryBuilder("tournament")
        .innerJoinAndSelect("tournament.teams", "team")
        .innerJoinAndSelect("team.members", "member")
        .leftJoinAndSelect("member.userStatistics", "stats")
        .leftJoinAndSelect("stats.modeDivision", "statMode")
        .where("tournament.registrationsEnd <= :date", { date: job.date })
        .andWhere("tournament.status != '0'")
        .getMany();

    // For each tournament, set their status to ongoing
    await Promise.all(tournaments.map(t => {
        t.status = TournamentStatus.Ongoing;
        return t.save();
    }));

    const teams = tournaments.flatMap(t => t.teams).filter((v, i, a) => a.findIndex(t => t.ID === v.ID) === i);
    await Promise.all(teams.map(t => t.calculateStats()));
}

export default {
    initialize,
    execute,
};