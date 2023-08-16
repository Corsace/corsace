import Router from "@koa/router";
import koaBasicAuth from "koa-basic-auth";
import { config } from "node-config-ts";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { Next, ParameterizedContext } from "koa";
import runMatchup from "../../../../BanchoBot/functions/tournaments/matchup/runMatchup";
import state, { MatchupList } from "../../../../BanchoBot/state";

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

    const matchup = state.matchups[parseInt(id)];

    if (matchup && endpoint === "createLobby" && !ctx.request.body.replace) {
        ctx.body = {
            success: false,
            error: "Matchup already has a lobby",
        };
        return;
    }

    if (!matchup && endpoint !== "createLobby") {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    ctx.state.matchup = matchup;
    await next();
}

banchoRefereeRouter.post("/:matchupID/createLobby", validateMatchup, async (ctx) => {
    const matchupList: MatchupList | undefined | null = ctx.state.matchup;
    let matchup: Matchup | undefined | null = matchupList?.matchup;
    if (!matchup) {
        matchup = await Matchup
            .createQueryBuilder("matchup")
            .leftJoinAndSelect("matchup.referee", "referee")
            .leftJoinAndSelect("matchup.streamer", "streamer")
            .innerJoinAndSelect("matchup.stage", "stage")
            .innerJoinAndSelect("stage.mappool", "mappool")
            .innerJoinAndSelect("mappool.slots", "slot")
            .innerJoinAndSelect("slot.maps", "map")
            .innerJoinAndSelect("map.beatmap", "beatmap")
            .innerJoinAndSelect("stage.tournament", "tournament")
            .innerJoinAndSelect("tournament.organizer", "organizer")
            .leftJoinAndSelect("matchup.team1", "team1")
            .leftJoinAndSelect("team1.manager", "manager1")
            .leftJoinAndSelect("team1.members", "member1")
            .leftJoinAndSelect("matchup.team2", "team2")
            .leftJoinAndSelect("team2.manager", "manager2")
            .leftJoinAndSelect("team2.members", "member2")
            .where("matchup.ID = :id", { id: ctx.params.matchupID })
            .getOne();
        if (!matchup) {
            ctx.body = {
                success: false,
                error: "Matchup not found",
            };
            return;
        }
    }

    if (!ctx.request.body.replace && (matchup.mp || matchup.baseURL || matchup.winner)) {
        ctx.body = {
            success: false,
            error: "Matchup already has a lobby",
        };
        return;
    }

    ctx.body = {
        success: true,
    };

    await runMatchup(matchup, ctx.request.body.replace, ctx.request.body.auto);
});

banchoRefereeRouter.post("/:matchupID/roll", validateMatchup, async (ctx) => {
    const matchupList: MatchupList | undefined = ctx.state.matchup;
    if (!matchupList) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }
    const mpChannel = matchupList.lobby.channel;
    
    await mpChannel.sendMessage("OK we're gonna roll now I'm gonna run !roll 2");
    await mpChannel.sendMessage(`${matchupList.matchup.team1?.name} will be 1 and ${matchupList.matchup.team2?.name} will be 2`);
    await mpChannel.sendMessage("!roll 2");

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/invite", validateMatchup, async (ctx) => {
    const matchupList: MatchupList | undefined = ctx.state.matchup;
    if (!matchupList) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const mpLobby = matchupList.lobby;
    await mpLobby.invitePlayer(`#${ctx.request.body.userID}`);

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/addRef", validateMatchup, async (ctx) => {
    const matchupList: MatchupList | undefined = ctx.state.matchup;
    if (!matchupList) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const mpLobby = matchupList.lobby;
    await mpLobby.addRef(`#${ctx.request.body.userID}`);

    ctx.body = {
        success: true,
    };
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