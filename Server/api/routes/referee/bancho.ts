import axios from "axios";
import { CorsaceRouter } from "../../../corsaceRouter";
import { config } from "node-config-ts";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { isLoggedInDiscord } from "../../../middleware";
import { TournamentRole } from "../../../../Models/tournaments/tournamentRole";
import { TournamentRoleType } from "../../../../Interfaces/tournament";
import { discordClient } from "../../../discord";
import { hasRoles, validateTournament } from "../../../middleware/tournament";
import { ResponseBody, TournamentAuthenticatedState } from "koa";

const refereeBanchoRouter  = new CorsaceRouter();

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
        const { data } = await axios.post<ResponseBody<object>>(`${matchup.baseURL ?? config.banchoBot.publicUrl}/api/bancho/referee/${matchup.ID}/${ctx.request.body.endpoint}`, {
            ...ctx.request.body,
            endpoint: undefined,
            user: ctx.state.user,
        }, {
            auth: config.interOpAuth,
        });

        ctx.body = data;

    } catch (e) {
        if (axios.isAxiosError(e)) {
            ctx.body = e.response?.data ?? {
                success: false,
                error: e.message,
            };
            ctx.status = e.response?.status ?? 500;
        } else if (e instanceof Error) {
            ctx.body = {
                success: false,
                error: e.message,
            };
        } else {
            ctx.body = {
                success: false,
                error: `Unknown error: ${e}`,
            };
        }
    }
});

export default refereeBanchoRouter;