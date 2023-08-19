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

    if (matchupList && endpoint === "createLobby" && !ctx.request.body.replace) {
        ctx.body = {
            success: false,
            error: "Matchup already has a lobby",
        };
        return;
    }

    if (!matchupList) {
        if (endpoint === "pulse")
            ctx.body = {
                success: true,
                pulse: false,
            };
        else if (endpoint !== "createLobby")
            ctx.body = {
                success: false,
                error: "Matchup not found",
            };
        
        if (endpoint !== "createLobby")
            return;
    }

    ctx.state.matchupID = parseInt(id);
    await next();
}

banchoRefereeRouter.post("/:matchupID/pulse", validateMatchup, async (ctx) => {
    if (!state.matchups[parseInt(ctx.state.matchupID)]) {
        ctx.body = {
            success: true,
            pulse: false,
        };
        return;
    }

    const mpLobby = state.matchups[parseInt(ctx.state.matchupID)].lobby;
    await mpLobby.updateSettings();

    await publish(state.matchups[parseInt(ctx.state.matchupID)].matchup, { 
        type: "settings",
        slots: mpLobby.slots.map((slot, i) => ({
            playerOsuID: slot?.user.id,
            slot: i + 1,
            mods: slot?.mods.map(mod => mod.shortMod).join(""),
            team: slot?.team,
            ready: slot?.state === BanchoLobbyPlayerStates.Ready,
        })),
    });

    ctx.body = {
        success: true,
        pulse: true,
    };
});

banchoRefereeRouter.post("/:matchupID/createLobby", validateMatchup, async (ctx) => {
    const matchupList: MatchupList | undefined | null = state.matchups[parseInt(ctx.state.matchupID)];
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

    try {
        await runMatchup(matchup, ctx.request.body.replace, ctx.request.body.auto);
    } catch (error) {
        if (error instanceof Error)
            ctx.body = {
                success: false,
                error: error.message,
            };
        else
            ctx.body = {
                success: false,
                error: `Unknown error, ${error}`,
            };
    }
});

banchoRefereeRouter.post("/:matchupID/roll", validateMatchup, async (ctx) => {
    if (!state.matchups[parseInt(ctx.state.matchupID)]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }
    const mpChannel = state.matchups[parseInt(ctx.state.matchupID)].lobby.channel;
    
    await mpChannel.sendMessage("OK we're gonna roll now I'm gonna run !roll 2");
    await mpChannel.sendMessage(`${state.matchups[parseInt(ctx.state.matchupID)].matchup.team1?.name} will be 1 and ${state.matchups[parseInt(ctx.state.matchupID)].matchup.team2?.name} will be 2`);
    await mpChannel.sendMessage("!roll 2");

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/invite", validateMatchup, async (ctx) => {
    if (!state.matchups[parseInt(ctx.state.matchupID)]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    if (!ctx.request.body.userID || isNaN(parseInt(ctx.request.body.userID))) {
        ctx.body = {
            success: false,
            error: "Invalid user ID",
        };
        return;
    }

    const mpLobby = state.matchups[parseInt(ctx.state.matchupID)].lobby;
    await mpLobby.invitePlayer(`#${ctx.request.body.userID}`);

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/addRef", validateMatchup, async (ctx) => {
    if (!state.matchups[parseInt(ctx.state.matchupID)]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    if (!ctx.request.body.userID || isNaN(parseInt(ctx.request.body.userID))) {
        ctx.body = {
            success: false,
            error: "Invalid user ID",
        };
        return;
    }

    const mpLobby = state.matchups[parseInt(ctx.state.matchupID)].lobby;
    await mpLobby.addRef(`#${ctx.request.body.userID}`);

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/selectMap", validateMatchup, async (ctx) => {
    const mapID = ctx.request.body.mapID;
    if (!state.matchups[parseInt(ctx.state.matchupID)] || !mapID || typeof mapID !== "number" || isNaN(mapID)) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const status = ctx.request.body.status;
    if (typeof status !== "number" || isNaN(status) || status < 0 || status > 2) {
        ctx.body = {
            success: false,
            error: "Invalid map status provided",
        };
        return;
    }

    const slot = state.matchups[parseInt(ctx.state.matchupID)].matchup.stage!.mappool!.flatMap(pool => pool.slots).find(slot => slot.maps.some(map => map.ID === mapID));
    if (!slot) {
        ctx.body = {
            success: false,
            error: "Slot not found",
        };
        return;
    }

    const map = slot.maps.find(map => map.ID === mapID);
    if (!map) {
        ctx.body = {
            success: false,
            error: "Map not found",
        };
        return;
    }

    if (status !== 2) {
        // Add map to matchup.maps
        if (!state.matchups[parseInt(ctx.state.matchupID)].matchup.maps)
            state.matchups[parseInt(ctx.state.matchupID)].matchup.maps = [];
        const matchupMap = new MatchupMap;
        matchupMap.map = map;
        matchupMap.matchup = state.matchups[parseInt(ctx.state.matchupID)].matchup;
        matchupMap.status = status;
        matchupMap.order = state.matchups[parseInt(ctx.state.matchupID)].matchup.maps!.length + 1;
        await matchupMap.save();
        state.matchups[parseInt(ctx.state.matchupID)].matchup.maps!.push(matchupMap);

        await publish(state.matchups[parseInt(ctx.state.matchupID)].matchup, {
            type: "map",
            map: {
                ID: matchupMap.ID,
                map,
                order: matchupMap.order,
                status: matchupMap.status,
            },
        });
    } else {
        const mpLobby = state.matchups[parseInt(ctx.state.matchupID)].lobby;
        await Promise.all([
            mpLobby.setMap(map.beatmap!.ID),
            mpLobby.setMods(getMappoolSlotMods(slot.allowedMods), typeof slot.allowedMods !== "number" || typeof slot.uniqueModCount === "number" || typeof slot.userModCount === "number"),
        ]);
    }

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/deleteMap", validateMatchup, async (ctx) => {
    const mapID = ctx.request.body.mapID;
    if (!state.matchups[parseInt(ctx.state.matchupID)] || !mapID || typeof mapID !== "number" || isNaN(mapID)) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const matchupMap = state.matchups[parseInt(ctx.state.matchupID)].matchup.maps?.find(map => map.ID === mapID);
    if (!matchupMap) {
        ctx.body = {
            success: false,
            error: "Map not found",
        };
        return;
    }

    try {
        await ormConfig.transaction(async manager => {
            await manager.remove(matchupMap);

            state.matchups[parseInt(ctx.state.matchupID)].matchup.maps = state.matchups[parseInt(ctx.state.matchupID)].matchup.maps?.filter(map => map.ID !== mapID);
            state.matchups[parseInt(ctx.state.matchupID)].matchup.maps?.forEach((map, i) => map.order = i + 1);
            await Promise.all(state.matchups[parseInt(ctx.state.matchupID)].matchup.maps?.map(map => manager.save(map)) ?? []);
        });

        ctx.body = {
            success: true,
            mapID,
        };
    } catch (error) {
        if (error instanceof Error)
            ctx.body = {
                success: false,
                error: error.message,
            };
        else
            ctx.body = {
                success: false,
                error: `Unknown error, ${error}`,
            };
    }
});

banchoRefereeRouter.post("/:matchupID/startMap", validateMatchup, async (ctx) => {
    if (!state.matchups[parseInt(ctx.state.matchupID)]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    if (ctx.request.body.time && (typeof ctx.request.body.time !== "number" || isNaN(ctx.request.body.time))) {
        ctx.body = {
            success: false,
            error: "Invalid time provided (in seconds)",
        };
        return;
    }

    const mpLobby = state.matchups[parseInt(ctx.state.matchupID)].lobby;
    await mpLobby.startMatch(ctx.request.body.time || 5);

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/timer", validateMatchup, async (ctx) => {
    if (!state.matchups[parseInt(ctx.state.matchupID)]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    if (typeof ctx.request.body.time !== "number" || isNaN(ctx.request.body.time)) {
        ctx.body = {
            success: false,
            error: "Invalid time provided (in seconds)",
        };
        return;
    }

    const mpLobby = state.matchups[parseInt(ctx.state.matchupID)].lobby;
    await mpLobby.startTimer(ctx.request.body.time);

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/settings", validateMatchup, async (ctx) => {
    if (!state.matchups[parseInt(ctx.state.matchupID)]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const mpLobby = state.matchups[parseInt(ctx.state.matchupID)].lobby;
    await mpLobby.updateSettings();

    await publish(state.matchups[parseInt(ctx.state.matchupID)].matchup, { 
        type: "settings",
        slots: mpLobby.slots.map((slot, i) => ({
            playerOsuID: slot?.user.id,
            slot: i + 1,
            mods: slot?.mods.map(mod => mod.shortMod).join(""),
            team: slot?.team,
            ready: slot?.state === BanchoLobbyPlayerStates.Ready,
        })),
    });

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/abortMap", validateMatchup, async (ctx) => {
    if (!state.matchups[parseInt(ctx.state.matchupID)]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const mpLobby = state.matchups[parseInt(ctx.state.matchupID)].lobby;
    await mpLobby.abortMatch();

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/message", validateMatchup, async (ctx) => {
    if (!state.matchups[parseInt(ctx.state.matchupID)]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const mpChannel = state.matchups[parseInt(ctx.state.matchupID)].lobby.channel;
    await mpChannel.sendMessage(`<${ctx.request.body.username}>: ${ctx.request.body.message}`);

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/closeLobby", validateMatchup, async (ctx) => {
    if (!state.matchups[parseInt(ctx.state.matchupID)]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const mpLobby = state.matchups[parseInt(ctx.state.matchupID)].lobby;
    await mpLobby.closeLobby();

    ctx.body = {
        success: true,
    };
});

export default banchoRefereeRouter;