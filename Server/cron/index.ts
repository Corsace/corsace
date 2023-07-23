import Axios from "axios";
import { config } from "node-config-ts";
import { CronJob } from "cron";
import cronFunctions from "./cronFunctions";
import { CronJobData, CronJobType } from "../../Interfaces/cron";
import state from "./state";
import { maybeShutdown } from "../cron-runner";

class Cron {

    private data: CronJobData[] = [];
    private jobs: CronJob[] = [];
    private initialized = false;

    public async initialize () {
        const data = await Promise.all(Object.values(cronFunctions).map(async func => await func.initialize()));

        if (state.shuttingDown)
            return;

        this.data = data.flat();
        this.jobs = this.data.map(job => new CronJob(job.date, async () => await cronFunctions[job.type].execute(job), undefined, true));

        this.initialized = true;
        console.log("Cron runner initialized!");
    }

    public async add (type: CronJobType, date: Date) {
        if (!this.initialized) {
            const { data } = await Axios.post(`${config.cronRunner.publicUrl}/api/cron/add`, {
                type,
                date: date.getTime(),
            }, {
                auth: config.interOpAuth,
            });
            if (!data.success)
                throw new Error(data.error);
            return;
        }

        const job = { type, date };
        if (this.data.find(j => j.type === type && j.date.getTime() === date.getTime()))
            return;

        this.data.push(job);
        this.jobs.push(new CronJob(date, async () => {
            state.runningJobs++;
            try {
                await cronFunctions[job.type].execute(job);
            } catch (err) {
                console.error(`An unhandled error occured while executing job ${job.type}`, err);
            }
            state.runningJobs--;
            maybeShutdown();
        }, undefined, true));
    }

    public async remove (type: CronJobType, date: Date) {
        if (!this.initialized) {
            const { data } = await Axios.post(`${config.cronRunner.publicUrl}/api/cron/remove`, {
                type,
                date: date.getTime(),
            }, {
                auth: config.interOpAuth,
            });
            if (!data.success)
                throw new Error(data.error);
            return;
        }

        const index = this.data.findIndex(job => job.type === type && job.date.getTime() === date.getTime());
        if (index === -1)
            return;

        this.data.splice(index, 1);
        this.jobs[index].stop();
        this.jobs.splice(index, 1);
    }

    public listJobs () {
        return this.data;
    }

    public stopAllJobs () {
        this.jobs.forEach(job => job.stop());
    }
}

const cron = new Cron();

export { cron };
