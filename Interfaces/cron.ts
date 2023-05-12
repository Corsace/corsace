export enum CronJobType {
    Jobboard,
    Custommap,
}

export interface CronJobData {
    type: CronJobType;
    date: Date;
}