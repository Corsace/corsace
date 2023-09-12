import "koa";
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

        cronJob?: {
            type: number;
            date: Date;
        }

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
}