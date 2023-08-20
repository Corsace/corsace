import Router from "@koa/router";
import koaBasicAuth from "koa-basic-auth";
import { config } from "node-config-ts";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { Next, ParameterizedContext } from "koa";
import runMatchup from "../../../../BanchoBot/functions/tournaments/matchup/runMatchup";
import state, { MatchupList } from "../../../../BanchoBot/state";
import { publish } from "../../../../BanchoBot/functions/tournaments/matchup/centrifugo";
import { BanchoLobbyPlayerStates } from "bancho.js";
import getMappoolSlotMods from "../../../../BanchoBot/functions/tournaments/matchup/getMappoolSlotMods";
import { MatchupMap } from "../../../../Models/tournaments/matchupMap";
import ormConfig from "../../../../ormconfig";

const banchoRefereeRouter = new Router();

banchoRefereeRouter.use(koaBasicAuth({
    name: config.interOpAuth.username,
    pass: config.interOpAuth.password,
}));

async function validateMatchup (ctx: ParameterizedContext, next: Next) {
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

banchoRefereeRouter.get("/:matchupID/pulseMatch", validateMatchup, async (ctx) => {
    if (!state.matchups[parseInt(ctx.state.matchupID)]) {
        ctx.body = {
            success: true,
            pulse: false,
        };
        return;
    }

    const mpLobby = state.matchups[parseInt(ctx.state.matchupID)].lobby;
    await mpLobby.updateSettings();

    ctx.body = {
        success: true,
        pulse: true,
        team1Score: state.matchups[parseInt(ctx.state.matchupID)].matchup.team1Score,
        team2Score: state.matchups[parseInt(ctx.state.matchupID)].matchup.team2Score,
        beatmapID: mpLobby.beatmapId,
    };
});

export default banchoRefereeRouter;