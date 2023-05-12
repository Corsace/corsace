import jobBoardExecute from "./jobBoard";
import customMapExecute from "./customMap";
import { CronJobData, CronJobType } from "../../../Interfaces/cron";

export default {
    [CronJobType.Jobboard]: jobBoardExecute,
    [CronJobType.Custommap]: customMapExecute,
} as { 
    [key in CronJobType]: { 
        execute: (job: CronJobData) => Promise<void>,
        initialize: () => Promise<CronJobData[]>,
    } 
};