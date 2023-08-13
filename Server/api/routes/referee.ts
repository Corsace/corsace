import Router from "@koa/router";
import { TournamentRoleType } from "../../../Interfaces/tournament";
import { Matchup } from "../../../Models/tournaments/matchup";
import { isLoggedInDiscord } from "../../middleware";
import { hasRoles, validateTournament } from "../../middleware/tournament";

const refereeRouter = new Router();

refereeRouter.get("/matchups/:tournamentID", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    const matchups = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.referee", "referee")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.round", "round")
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

refereeRouter.get("/matchups/:tournamentID/:matchupID", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.referee", "referee")
        .leftJoinAndSelect("matchup.round", "round")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("team1.manager", "manager1")
        .leftJoinAndSelect("team2.manager", "manager2")
        .leftJoinAndSelect("team1.members", "members1")
        .leftJoinAndSelect("team2.members", "members2")
        .leftJoinAndSelect("matchup.first", "first")
        .leftJoinAndSelect("matchup.winner", "winner")
        .leftJoinAndSelect("matchup.maps", "maps")
        .leftJoinAndSelect("maps.map", "map")
        .leftJoinAndSelect("map.slot", "slot")
        .leftJoinAndSelect("maps.scores", "scores")
        .leftJoinAndSelect("maps.winner", "mapWinner")
        .leftJoinAndSelect("matchup.messages", "messages")
        .leftJoinAndSelect("messages.user", "user")
        .where("matchup.ID = :ID", { ID: ctx.params.matchupID })
        .getOne();

    if (!matchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found.",
        };
        return;
    }

    ctx.body = {
        success: true,
        matchup,
    };
});

export default refereeRouter;