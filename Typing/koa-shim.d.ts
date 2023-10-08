import "koa";
import "@koa/router";
import { CronJobData } from "../Interfaces/cron";
import { MCA } from "../Models/MCA_AYIM/mca";
import { ModeDivision } from "../Models/MCA_AYIM/modeDivision";
import { UserComment } from "../Models/MCA_AYIM/userComments";
import { Round } from "../Models/tournaments/round";
import { Stage } from "../Models/tournaments/stage";
import { Team } from "../Models/tournaments/team";
import { Tournament } from "../Models/tournaments/tournament";
import { User } from "../Models/user";

declare module "koa" {
    interface DefaultState {
        user?: User;

        cronJob?: CronJobData;

        comment?: UserComment;
        year?: number;
        mca?: MCA;
        mode?: ModeDivision;

        team?: Team;
        tournamentID?: number;
        tournament?: Tournament;
        stage?: Stage;
        round?: Round;
        matchupDate?: Date;
        matchupID?: number;
    }

    // InterOP
    
    interface CronJobState extends DefaultState {
        cronJob: CronJobData;
    }

    interface BanchoMatchupState extends DefaultState {
        matchupID: number;
    }

    // General

    interface UserAuthenticatedState extends DefaultState {
        user: User;
    }

    // Tournaments

    interface TournamentState extends DefaultState {
        tournament: Tournament;
    }

    type TournamentAuthenticatedState = TournamentState & UserAuthenticatedState;

    interface TournamentStageState extends TournamentState {
        stage: Stage;
    }

    interface TournamentRoundState extends TournamentStageState {
        round: Round;
    }

    interface TeamState extends DefaultState {
        team: Team;
    }

    type TeamAuthenticatedState = TeamState & UserAuthenticatedState;

    // MCA

    interface MCAState extends DefaultState {
        mca: MCA;
    }

    type MCAAuthenticatedState = MCAState & UserAuthenticatedState; 

    interface MCAYearState extends UserAuthenticatedState {
        year: number;
    }

    interface CommentState extends DefaultState {
        comment: UserComment;
    }

    type CommentAuthenticatedState = CommentState & UserAuthenticatedState;

    // Typing for general routing

    interface ErrorResponseBody {
        success: false;
        error: string;
    }

    type SuccessResponseBody<BodyT = any> = {
        success: true;
    } & BodyT;

    type ResponseBody<BodyT = any> = ErrorResponseBody | SuccessResponseBody<BodyT>;
}