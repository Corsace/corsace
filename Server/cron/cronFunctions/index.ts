import jobBoardExecute from "./jobBoard";
import customMapExecute from "./customMap";
import tournamentRegistrationStartExecute from "./tournamentRegistrationStart";
import tournamentRegistrationEndExecute from "./tournamentRegistrationEnd";
import { CronJobType } from "../../../Interfaces/cron";

export default {
    [CronJobType.Jobboard]: jobBoardExecute,
    [CronJobType.Custommap]: customMapExecute,
    [CronJobType.TournamentRegistrationStart]: tournamentRegistrationStartExecute,
    [CronJobType.TournamentRegistrationEnd]: tournamentRegistrationEndExecute,

};