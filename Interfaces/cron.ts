export enum CronJobType {
    Jobboard,
    Custommap,
    TournamentRegistrationStart,
    TournamentRegistrationEnd,
}

export interface CronJobData {
    type: CronJobType;
    date: Date;
}