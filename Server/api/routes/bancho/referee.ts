import Axios from "axios";
import Router from "@koa/router";
import koaBasicAuth from "koa-basic-auth";
import { config } from "node-config-ts";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { Next, ParameterizedContext } from "koa";
import runMatchup from "../../../../BanchoBot/functions/tournaments/matchup/runMatchup";
import runSocketMatchup from "../../../../BanchoBot/functions/tournaments/matchup/runSocketMatchup";

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

    const matchupQ = await Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .innerJoinAndSelect("tournament.organizer", "organizer")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2");

    switch (ctx.URL.pathname.split("/")[ctx.URL.pathname.split("/").length - 1]) {
        case "createLobby":
            matchupQ.leftJoinAndSelect("matchup.winner", "winner");
            break;
        case "roll":
            matchupQ.leftJoinAndSelect("matchup.first", "first");
            break;
        case "invite":
            matchupQ
                .leftJoinAndSelect("team1.manager", "team1Manager")
                .leftJoinAndSelect("team2.manager", "team2Manager")
                .leftJoinAndSelect("team1.members", "team1Members")
                .leftJoinAndSelect("team2.members", "team2Members");
            break;
        case "addRef":
            matchupQ
                .leftJoinAndSelect("matchup.referee", "referee")
                .leftJoinAndSelect("matchup.commentators", "commentators")
                .leftJoinAndSelect("matchup.streamer", "streamer");
            break;
        case "selectMap":
            matchupQ
                .leftJoinAndSelect("matchup.maps", "maps")
                .leftJoinAndSelect("maps.map", "map")
                .leftJoinAndSelect("map.slot", "slot");
            break;
        case "startMap":
        case "timer":
        case "settings":
        case "abortMap":
            break;
        case "message":
            matchupQ
                .leftJoinAndSelect("matchup.messages", "messages")
                .leftJoinAndSelect("messages.user", "user");
            break;
        case "closeLobby":
            break;
    }

    const matchup = await matchupQ
        .where("matchup.id = :id", { id })
        .getOne();

    if (!matchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found or invalid for this operation",
        };
        return;
    }

    ctx.state.matchup = matchup;
    await next();
}

banchoRefereeRouter.post("/:matchupID/createLobby", validateMatchup, async (ctx) => {
    const matchup: Matchup = ctx.state.matchup;
    if (!ctx.request.body.replace && (matchup.mp || matchup.baseURL || matchup.winner)) {
        ctx.body = {
            success: false,
            error: "Matchup already has a lobby",
        };
        return;
    }

    await runMatchup(matchup, ctx.request.body.replace, runSocketMatchup);
});

banchoRefereeRouter.post("/:matchupID/roll", validateMatchup, async (ctx) => {

});

banchoRefereeRouter.post("/:matchupID/invite", validateMatchup, async (ctx) => {

});

banchoRefereeRouter.post("/:matchupID/addRef", validateMatchup, async (ctx) => {

});

banchoRefereeRouter.post("/:matchupID/selectMap", validateMatchup, async (ctx) => {

});

banchoRefereeRouter.post("/:matchupID/startMap", validateMatchup, async (ctx) => {

});

banchoRefereeRouter.post("/:matchupID/timer", validateMatchup, async (ctx) => {

});

banchoRefereeRouter.post("/:matchupID/settings", validateMatchup, async (ctx) => {

});

banchoRefereeRouter.post("/:matchupID/abortMap", validateMatchup, async (ctx) => {

});

banchoRefereeRouter.post("/:matchupID/message", validateMatchup, async (ctx) => {

});

banchoRefereeRouter.post("/:matchupID/closeLobby", validateMatchup, async (ctx) => {

});

export default banchoRefereeRouter;