import Router from "@koa/router";
import koaBasicAuth from "koa-basic-auth";
import { config } from "node-config-ts";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { BanchoMatchupState, Next, ParameterizedContext } from "koa";
import runMatchup from "../../../../BanchoBot/functions/tournaments/matchup/runMatchup";
import state, { MatchupList } from "../../../../BanchoBot/state";
import { publish } from "../../../../BanchoBot/functions/tournaments/matchup/centrifugo";
import { BanchoLobbyPlayerStates } from "bancho.js";
import getMappoolSlotMods from "../../../../BanchoBot/functions/tournaments/matchup/getMappoolSlotMods";
import { MatchupMap } from "../../../../Models/tournaments/matchupMap";
import ormConfig from "../../../../ormconfig";
import { StageType } from "../../../../Interfaces/stage";

const banchoRefereeRouter = new Router<BanchoMatchupState>();

banchoRefereeRouter.use(koaBasicAuth({
    name: config.interOpAuth.username,
    pass: config.interOpAuth.password,
}));

banchoRefereeRouter.use(async (ctx: ParameterizedContext, next: Next) => {
    const id = ctx.params.matchupID;
    if (!id || isNaN(parseInt(id))) {
        ctx.body = {
            success: false,
            error: "Invalid matchup ID",
        };
        return;
    }

    if (!ctx.request.body.user) {
        ctx.body = {
            success: false,
            error: "Missing user",
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
});

banchoRefereeRouter.post("/:matchupID/pulse", async (ctx) => {
    if (!state.matchups[ctx.state.matchupID]) {
        ctx.body = {
            success: true,
            pulse: false,
        };
        return;
    }

    // TODO: Remove ! after reactive koa typing is functional
    const mpLobby = state.matchups[ctx.state.matchupID].lobby;
    await mpLobby.updateSettings();

    await publish(state.matchups[ctx.state.matchupID].matchup, { 
        type: "settings",
        slots: mpLobby.slots.map((slot, i) => ({
            playerOsuID: slot?.user.id,
            slot: i + 1,
            mods: slot?.mods.map(mod => mod.shortMod).join(""),
            team: slot?.team as "Blue" | "Red",
            ready: slot?.state === BanchoLobbyPlayerStates.Ready,
        })),
    });

    ctx.body = {
        success: true,
        pulse: true,
    };
});

banchoRefereeRouter.post("/:matchupID/createLobby", async (ctx) => {
    const matchupList: MatchupList | undefined | null = state.matchups[ctx.state.matchupID];
    let matchup: Matchup | undefined | null = matchupList?.matchup;
    if (!matchup) {
        matchup = await Matchup
            .createQueryBuilder("matchup")
            .leftJoinAndSelect("matchup.referee", "referee")
            .leftJoinAndSelect("matchup.streamer", "streamer")
            .leftJoinAndSelect("matchup.round", "round")
            .leftJoinAndSelect("round.mapOrder", "roundMapOrder")
            .leftJoinAndSelect("round.mappool", "roundMappool")
            .leftJoinAndSelect("roundMappool.slots", "roundSlot")
            .leftJoinAndSelect("roundSlot.maps", "roundMap")
            .leftJoinAndSelect("roundMap.beatmap", "roundBeatmap")
            .innerJoinAndSelect("matchup.stage", "stage")
            .leftJoinAndSelect("stage.mapOrder", "stageMapOrder")
            .leftJoinAndSelect("stage.mappool", "stageMappool")
            .leftJoinAndSelect("stageMappool.slots", "stageSlot")
            .leftJoinAndSelect("stageSlot.maps", "stageMap")
            .leftJoinAndSelect("stageMap.beatmap", "stageBeatmap")
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

    if (!ctx.request.body.replace && (matchup.mp ?? matchup.baseURL ?? matchup.winner)) {
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
        await runMatchup(matchup, ctx.request.body.replace, ctx.request.body.auto, `${ctx.request.body.user.osu.username} (${ctx.request.body.user.osu.userID})`);
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

banchoRefereeRouter.post("/:matchupID/roll", async (ctx) => {
    if (!state.matchups[ctx.state.matchupID]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    if (state.matchups[ctx.state.matchupID].matchup.stage?.stageType === StageType.Qualifiers) {
        ctx.body = {
            success: false,
            error: "Cannot roll for qualifiers",
        };
        return;
    }

    const allowed = ctx.request.body.allowed;
    if (allowed !== "managers" && allowed !== "all" && allowed !== "bot") {
        ctx.body = {
            success: false,
            error: "Invalid allowed value",
        };
        return;
    }

    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const mpChannel = state.matchups[ctx.state.matchupID].lobby.channel;
    if (allowed === "managers")
        await mpChannel.sendMessage("OK we're gonna roll now, I want the managers to do !roll, higher roll will be considered Team 1");
    else if (allowed === "all")
        await mpChannel.sendMessage("OK we're gonna roll now, I want the stand-in managers to do !roll, higher roll will be considered Team 1");
    else if (allowed === "bot") {
        await mpChannel.sendMessage("OK we're gonna roll now, I'm gonna run !roll 2");
        await pause(100);
        await mpChannel.sendMessage(`${state.matchups[ctx.state.matchupID].matchup.team1?.name} will be 1 and ${state.matchups[ctx.state.matchupID].matchup.team2?.name} will be 2`);
        await pause(100);
        await mpChannel.sendMessage("!roll 2");
    }

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/invite", async (ctx) => {
    if (!state.matchups[ctx.state.matchupID]) {
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

    const mpLobby = state.matchups[ctx.state.matchupID].lobby;
    await mpLobby.invitePlayer(`#${ctx.request.body.userID}`);

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/addRef", async (ctx) => {
    if (!state.matchups[ctx.state.matchupID]) {
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

    const mpLobby = state.matchups[ctx.state.matchupID].lobby;
    await mpLobby.addRef(`#${ctx.request.body.userID}`);

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/selectMap", async (ctx) => {
    const mapID = ctx.request.body.mapID;
    if (!state.matchups[ctx.state.matchupID] || !mapID || typeof mapID !== "number" || isNaN(mapID)) {
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

    const set = ctx.request.body.set;
    if (typeof set !== "number" || isNaN(set) || set < 0) {
        ctx.body = {
            success: false,
            error: "Invalid set provided",
        };
        return;
    }

    // TODO: Remove ! after reactive koa typing is functional
    const slot = state.matchups[ctx.state.matchupID].matchup.stage!.mappool!.flatMap(pool => pool.slots).find(slot => slot.maps.some(map => map.ID === mapID));
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

    if (!state.matchups[ctx.state.matchupID].matchup.sets?.[set]) {
        ctx.body = {
            success: false,
            error: "Set not found",
        };
        return;
    }

    if (status !== 2) {
        // Add map to matchup.maps
        if (!state.matchups[ctx.state.matchupID].matchup.sets![set].maps)
            state.matchups[ctx.state.matchupID].matchup.sets![set].maps = [];
        const matchupMap = new MatchupMap;
        matchupMap.map = map;
        matchupMap.set = state.matchups[ctx.state.matchupID].matchup.sets![set];
        matchupMap.status = status;
        matchupMap.order = state.matchups[ctx.state.matchupID].matchup.sets![set].maps!.length + 1;
        await matchupMap.save();
        state.matchups[ctx.state.matchupID].matchup.sets![set].maps!.push(matchupMap);

        await publish(state.matchups[ctx.state.matchupID].matchup, {
            type: "selectMap",
            map: {
                ID: matchupMap.ID,
                map,
                order: matchupMap.order,
                status: matchupMap.status,
            },
        });
    } else {

        const mpLobby = state.matchups[ctx.state.matchupID].lobby;
        await Promise.all([
            mpLobby.setMap(map.beatmap!.ID),
            mpLobby.setMods(getMappoolSlotMods(slot.allowedMods), typeof slot.allowedMods !== "number" || typeof slot.uniqueModCount === "number" || typeof slot.userModCount === "number"),
            mpLobby.startTimer(typeof ctx.request.body.time !== "number" || isNaN(ctx.request.body.time) ? 90 : ctx.request.body.time),
        ]);
    }

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/deleteMap", async (ctx) => {
    const mapID = ctx.request.body.mapID;
    if (!state.matchups[ctx.state.matchupID] || !mapID || typeof mapID !== "number" || isNaN(mapID)) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const set = ctx.request.body.set;
    if (typeof set !== "number" || isNaN(set) || set < 0) {
        ctx.body = {
            success: false,
            error: "Invalid set provided",
        };
        return;
    }

    if (!state.matchups[ctx.state.matchupID].matchup.sets?.[set]) {
        ctx.body = {
            success: false,
            error: "Set not found",
        };
        return;
    }

    const matchupMap = state.matchups[ctx.state.matchupID].matchup.sets![set].maps?.find(map => map.ID === mapID);
    if (!matchupMap) {
        ctx.body = {
            success: false,
            error: "Map not found",
        };
        return;
    }

    try {
        await ormConfig.transaction(async manager => {
            state.matchups[ctx.state.matchupID].matchup.sets![set].maps = state.matchups[ctx.state.matchupID].matchup.sets![set].maps!.filter(map => map.ID !== mapID);
            state.matchups[ctx.state.matchupID].matchup.sets![set].maps!.forEach((map, i) => map.order = i + 1);
            
            await manager.remove(matchupMap);
            await Promise.all(state.matchups[ctx.state.matchupID].matchup.sets![set].maps!.map(map => manager.save(map)));

            await state.matchups[ctx.state.matchupID].lobby.channel.sendMessage(`Ref has deleted a map from matchup ${matchupMap.map.beatmap?.ID}`);
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

banchoRefereeRouter.post("/:matchupID/startMap", async (ctx) => {
    if (!state.matchups[ctx.state.matchupID]) {
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

    const mpLobby = state.matchups[ctx.state.matchupID].lobby;
    await mpLobby.startMatch(ctx.request.body.time || 5);

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/timer", async (ctx) => {
    if (!state.matchups[ctx.state.matchupID]) {
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

    const mpLobby = state.matchups[ctx.state.matchupID].lobby;
    await mpLobby.startTimer(ctx.request.body.time);

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/settings", async (ctx) => {
    if (!state.matchups[ctx.state.matchupID]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const mpLobby = state.matchups[ctx.state.matchupID].lobby;
    await mpLobby.updateSettings();

    await publish(state.matchups[ctx.state.matchupID].matchup, { 
        type: "settings",
        slots: mpLobby.slots.map((slot, i) => ({
            playerOsuID: slot?.user.id,
            slot: i + 1,
            mods: slot?.mods.map(mod => mod.shortMod).join(""),
            team: slot?.team as "Blue" | "Red",
            ready: slot?.state === BanchoLobbyPlayerStates.Ready,
        })),
    });

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/abortMap", async (ctx) => {
    if (!state.matchups[ctx.state.matchupID]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const mpLobby = state.matchups[ctx.state.matchupID].lobby;
    await mpLobby.abortMatch();

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/message", async (ctx) => {
    if (!state.matchups[ctx.state.matchupID]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const mpChannel = state.matchups[ctx.state.matchupID].lobby.channel;
    await mpChannel.sendMessage(`<${ctx.request.body.username}>: ${ctx.request.body.message}`);

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.post("/:matchupID/closeLobby", async (ctx) => {
    if (!state.matchups[ctx.state.matchupID]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const mpLobby = state.matchups[ctx.state.matchupID].lobby;
    await mpLobby.closeLobby();

    ctx.body = {
        success: true,
    };
});

export default banchoRefereeRouter;