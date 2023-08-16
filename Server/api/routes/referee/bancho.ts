import Axios from "axios";
import Router from "@koa/router";
import { config } from "node-config-ts";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { isLoggedInDiscord } from "../../../middleware";

const refereeBanchoRouter = new Router();

refereeBanchoRouter.use(isLoggedInDiscord);

refereeBanchoRouter.post("/:matchupID/bancho", async (ctx) => {
    if (!ctx.request.body.endpoint) {
        ctx.body = {
            success: false,
            error: "Missing endpoint",
        };
        return;
    }

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("matchup.referee", "referee")
        .leftJoinAndSelect("matchup.first", "first")
        .leftJoinAndSelect("matchup.winner", "winner")
        .leftJoinAndSelect("matchup.referee", "referee")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .innerJoinAndSelect("tournament.organizer", "organizer")
        .where("matchup.id = :matchupID", { matchupID: ctx.params.matchupID })
        .getOne();

    if (!matchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    if (matchup.referee?.ID !== ctx.state.user.id && matchup.stage!.tournament.organizer.ID !== ctx.state.user.id) {
        ctx.body = {
            success: false,
            error: "You are not the referee of this matchup",
        };
        return;
    }

    const { data } = await Axios.post(`${matchup.baseURL ?? config.banchoBot.publicUrl}/api/bancho/referee/${matchup.ID}/${ctx.request.body.endpoint}`, {
        ...ctx.request.body,
        endpoint: undefined,
    }, {
        auth: config.interOpAuth,
    });

    ctx.body = data;
});

export default refereeBanchoRouter;