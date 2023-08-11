import Router from "@koa/router";
import { TournamentRoleType } from "../../../Interfaces/tournament";
import { Matchup } from "../../../Models/tournaments/matchup";
import { isLoggedInDiscord } from "../../middleware";
import { hasRoles, validateTournament } from "../../middleware/tournament";

const refereeRouter = new Router();

refereeRouter.use(isLoggedInDiscord);
refereeRouter.use(hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]));

refereeRouter.get("/matchups/:tournamentID", validateTournament, async (ctx) => {
    const matchups = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.referee", "referee")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("matchup.round", "round")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("team1.manager", "manager1")
        .leftJoinAndSelect("team2.manager", "manager2")
        .leftJoinAndSelect("team1.members", "members1")
        .leftJoinAndSelect("team2.members", "members2")
        .leftJoinAndSelect("matchup.winner", "winner")
        .where("tournament.ID = :ID", { ID: ctx.state.ID })
        .andWhere("referee.ID = :refereeID", { refereeID: ctx.state.user.ID })
        .getMany();

    ctx.body = {
        success: true,
        matchups,
    };
});

export default refereeRouter;