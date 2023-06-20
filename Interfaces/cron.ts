export enum CronJobType {
    Jobboard,
    Custommap,
    TournamentRegistrationStart,
    TournamentRegistrationEnd,
    QualifierMatchup,
}

export interface CronJobData {
    type: CronJobType;
    date: Date;
}