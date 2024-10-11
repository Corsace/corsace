import { CorsaceRouter } from "../../../corsaceRouter";
import { config } from "node-config-ts";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { isLoggedInDiscord } from "../../../middleware";
import { TournamentRoleType } from "../../../../Interfaces/tournament";
import { hasRoles, validateTournament } from "../../../middleware/tournament";
import { ResponseBody, TournamentAuthenticatedState } from "koa";

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

        const { username, password } = config.interOpAuth;
        const authHeader =
            `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader,
            },
            body: JSON.stringify({
                ...ctx.request.body,
                endpoint: undefined,
                user: ctx.state.user,
            }),
        });

        if (response.ok) {
            const data = (await response.json()) as ResponseBody<object>;
            ctx.body = data;
        } else {
            const errorData = await response.json().catch(() => null);
            ctx.body = errorData ?? ({
                success: false,
                error: response.statusText || `Status code: ${response.status}`,
            } as ResponseBody<object>);
            ctx.status = response.status;
        }
    } catch (e) {
        if (e instanceof Error) {
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