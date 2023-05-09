import { CronJob } from 'cron';
import functions from './functions';
import { CronJobData, CronJobType } from '../../Interfaces/cron';

class Cron {

    private data: CronJobData[];
    private jobs: CronJob[]; 

    constructor (data?: CronJobData[]) {
        this.data = data || [];
        this.jobs = this.data.map(job => new CronJob(job.date, async () => await functions[job.type](job), undefined, true));
    }

    public add (type: CronJobType, date: Date) {
        const job = { type, date };
        if (this.data.find(j => j.type === type && j.date.getTime() === date.getTime()))
            return;

        this.data.push(job);
        this.jobs.push(new CronJob(date, async () => await functions[job.type](job), undefined, true));
    }

    public remove (type: CronJobType, date: Date) {
        const index = this.data.findIndex(job => job.type === type && job.date.getTime() === date.getTime());
        if (index === -1)
            return;

        this.data.splice(index, 1);
        this.jobs[index].stop();
        this.jobs.splice(index, 1);
    }
}

const cron = new Cron();

export { cron };