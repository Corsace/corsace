import { CorsaceContext, CorsaceRouter } from "../../../corsaceRouter";
import koaBasicAuth from "koa-basic-auth";
import { config } from "node-config-ts";
import { BanchoMatchupState, Next } from "koa";
import state from "../../../../BanchoBot/state";

const banchoRefereeRouter  = new CorsaceRouter<BanchoMatchupState>();

banchoRefereeRouter.$use(koaBasicAuth({
    name: config.interOpAuth.username,
    pass: config.interOpAuth.password,
}));

type pulseType = { pulse: false } | {
    pulse: true;
    team1Score: number;
    team2Score: number;
    beatmapID: number;
}

async function validateMatchup (ctx: CorsaceContext<pulseType>, next: Next) {
    const id = ctx.params.matchupID;
    if (!id || isNaN(parseInt(id))) {
        ctx.body = {
            success: false,
            error: "Invalid matchup ID",
        };
        return;
    }

    const endpoint = ctx.URL.pathname.split("/")[ctx.URL.pathname.split("/").length - 1];

    const matchupList = state.matchups[parseInt(id)];

    if (!matchupList) {
        if (endpoint.includes("pulse"))
            ctx.body = {
                success: true,
                pulse: false,
            };
        else
            ctx.body = {
                success: false,
                error: "Matchup not found",
            };
        return;
    }

    ctx.state.matchupID = parseInt(id);
    await next();
}

banchoRefereeRouter.$get<pulseType>("/:matchupID/pulseMatch", validateMatchup, async (ctx) => {
    if (!state.matchups[ctx.state.matchupID]) {
        ctx.body = {
            success: true,
            pulse: false,
        };
        return;
    }

    const mpLobby = state.matchups[ctx.state.matchupID].lobby;
    await mpLobby.updateSettings();

    ctx.body = {
        success: true,
        pulse: true,
        team1Score: state.matchups[ctx.state.matchupID].matchup.team1Score,
        team2Score: state.matchups[ctx.state.matchupID].matchup.team2Score,
        beatmapID: mpLobby.beatmapId,
    };
});

export default banchoRefereeRouter;