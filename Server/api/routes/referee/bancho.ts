import { CorsaceRouter } from "../../../corsaceRouter";
import { config } from "node-config-ts";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { isLoggedInDiscord } from "../../../middleware";
import { TournamentRoleType } from "../../../../Interfaces/tournament";
import { hasRoles, validateTournament } from "../../../middleware/tournament";
import { TournamentAuthenticatedState } from "koa";
import { post } from "../../../utils/fetch";
import { basicAuth } from "../../../utils/auth";

const refereeBanchoRouter = new CorsaceRouter();

refereeBanchoRouter.$post<object, TournamentAuthenticatedState>("/:tournamentID/:matchupID", validateTournament, isLoggedInDiscord, hasRoles([TournamentRoleType.Organizer, TournamentRoleType.Referees]), async (ctx) => {
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

    try {
        const url = `${matchup.baseURL ?? config.banchoBot.publicUrl}/api/bancho/referee/${matchup.ID}/${ctx.request.body.endpoint}`;
        const response = await post(url, {
            ...ctx.request.body,
            endpoint: undefined,
            user: ctx.state.user,
        },
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": basicAuth(config.interOpAuth),
            },
        });

        if (!response.success) {
            ctx.body = { success: false, error: typeof response.error === "string" ? response.error : response.error.message };
            ctx.status = 500;
            return;
        }
        ctx.body = response;
    } catch (e) {
        ctx.body = {
            success: false,
            error: e instanceof Error ? e.message : `Unknown error: ${e}`,
        };
    }
});

export default refereeBanchoRouter;