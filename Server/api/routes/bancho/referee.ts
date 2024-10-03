import { CorsaceRouter } from "../../../corsaceRouter";
import koaBasicAuth from "koa-basic-auth";
import { config } from "node-config-ts";
import { Matchup, MatchupWithRelationIDs } from "../../../../Models/tournaments/matchup";
import { BanchoMatchupState } from "koa";
import runMatchup from "../../../../BanchoBot/functions/tournaments/matchup/runMatchup";
import state, { MatchupList } from "../../../../BanchoBot/state";
import { publish } from "../../../functions/centrifugo";
import { BanchoLobbyPlayerStates } from "bancho.js";
import getMappoolSlotMods from "../../../../BanchoBot/functions/tournaments/matchup/getMappoolSlotMods";
import { MatchupMap } from "../../../../Models/tournaments/matchupMap";
import ormConfig from "../../../../ormconfig";
import { StageType } from "../../../../Interfaces/stage";
import { MapStatus } from "../../../../Interfaces/matchup";
import { MatchupSet } from "../../../../Models/tournaments/matchupSet";
import assignTeamsToNextMatchup from "../../../functions/tournaments/matchups/assignTeamsToNextMatchup";
import { Stage } from "../../../../Models/tournaments/stage";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { Team } from "../../../../Models/tournaments/team";
import { Round } from "../../../../Models/tournaments/round";
import { sleep } from "../../../utils/sleep";

const banchoRefereeRouter  = new CorsaceRouter<BanchoMatchupState>();

banchoRefereeRouter.$use(koaBasicAuth({
    name: config.interOpAuth.username,
    pass: config.interOpAuth.password,
}));

const allowedEndpointsWithoutRunningLobby = [
    "createLobby",
    "forfeit",
    "first",
    "selectMap",
    "deleteMap",
];

banchoRefereeRouter.$use<{ pulse: boolean }>("/:matchupID", async (ctx, next) => {
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
        else if (!allowedEndpointsWithoutRunningLobby.includes(endpoint))
            ctx.body = {
                success: false,
                error: "Matchup not found",
            };

        if (!allowedEndpointsWithoutRunningLobby.includes(endpoint))
            return;
    }

    ctx.state.matchupID = parseInt(id);
    await next();
});

banchoRefereeRouter.$post<{ pulse: boolean }>("/:matchupID/pulse", async (ctx) => {
    if (!state.matchups[ctx.state.matchupID]) {
        ctx.body = {
            success: true,
            pulse: false,
        };
        return;
    }

    const mpLobby = state.matchups[ctx.state.matchupID].lobby;
    await mpLobby.updateSettings();

    publish(`matchup:${state.matchups[ctx.state.matchupID].matchup.ID}`, {
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

banchoRefereeRouter.$post("/:matchupID/createLobby", async (ctx) => {
    const matchupList: MatchupList | undefined | null = state.matchups[ctx.state.matchupID];
    let matchup: Matchup | undefined | null = matchupList?.matchup;
    if (!matchup) {
        const baseMatchup = await Matchup
            .createQueryBuilder("matchup")
            .where("matchup.ID = :ID", { ID: ctx.params.matchupID })
            .getOne();
        if (!baseMatchup) {
            ctx.body = {
                success: false,
                error: "Base matchup not found",
            };
            return;
        }

        const matchupWithRelationIDs: MatchupWithRelationIDs = await Matchup
            .createQueryBuilder("matchup")
            .leftJoinAndSelect("matchup.referee", "referee")
            .leftJoinAndSelect("matchup.streamer", "streamer")
            .where("matchup.ID = :matchID", { matchID: ctx.params.matchupID })
            .loadAllRelationIds({
                relations: ["round", "stage", "team1", "team2"],
            })
            .getOne() as any;

        const stage = matchupWithRelationIDs.stage ? await Stage
            .createQueryBuilder("stage")
            .leftJoinAndSelect("stage.mapOrder", "mapOrder")
            .innerJoinAndSelect("stage.tournament", "tournament")
            .innerJoinAndSelect("tournament.organizer", "organizer")
            .where("stage.ID = :ID", { ID: matchupWithRelationIDs.stage })
            .getOne() : null;
        if (!stage) {
            ctx.body = {
                success: false,
                error: "Stage not found",
            };
            return;
        }
        stage.mappool = [];

        const round = matchupWithRelationIDs.round ? await Round
            .createQueryBuilder("round")
            .leftJoinAndSelect("round.mapOrder", "mapOrder")
            .where("round.ID = :ID", { ID: matchupWithRelationIDs.round })
            .getOne() : null;
        if (round)
            round.mappool = [];

        const mappoolQ = Mappool
            .createQueryBuilder("mappool")
            .innerJoinAndSelect("mappool.slots", "slots")
            .innerJoinAndSelect("slots.maps", "maps")
            .leftJoinAndSelect("maps.beatmap", "map")
            .where(`mappool.stageID = :ID`, { ID: stage.ID });
        if (round)
            mappoolQ.orWhere(`mappool.roundID = :ID`, { ID: round.ID });
        const mappools = (await mappoolQ
            .loadAllRelationIds({
                relations: ["round", "stage"],
            })
            .getMany())
            .map<Mappool>(pool => {
                pool.stage = stage;
                pool.round = pool.round && round ? round : undefined;
                return pool;
            });
        mappools.forEach(pool => {
            if (pool.round)
                round?.mappool?.push(pool);
            else
                stage.mappool?.push(pool);
        });

        const teamIds = new Set<number>();
        if (matchupWithRelationIDs.team1) teamIds.add(matchupWithRelationIDs.team1);
        if (matchupWithRelationIDs.team2) teamIds.add(matchupWithRelationIDs.team2);
        const teamQuery = teamIds.size === 0 ? [] : await Team
            .createQueryBuilder("team")
            .innerJoinAndSelect("team.members", "members")
            .innerJoinAndSelect("team.captain", "captain")
            .where("team.ID IN (:...teamIds)", { teamIds: Array.from(teamIds) })
            .getMany();
        const team1 = matchupWithRelationIDs.team1 ? teamQuery.find(team => team.ID === matchupWithRelationIDs.team1) : null;
        const team2 = matchupWithRelationIDs.team2 ? teamQuery.find(team => team.ID === matchupWithRelationIDs.team2) : null;

        baseMatchup.round = round;
        baseMatchup.stage = stage;
        baseMatchup.team1 = team1;
        baseMatchup.team2 = team2;

        matchup = baseMatchup;
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

banchoRefereeRouter.$post("/:matchupID/roll", async (ctx) => {
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
    if (allowed !== "captains" && allowed !== "all" && allowed !== "bot") {
        ctx.body = {
            success: false,
            error: "Invalid allowed value",
        };
        return;
    }

    const mpChannel = state.matchups[ctx.state.matchupID].lobby.channel;
    if (allowed === "captains")
        await mpChannel.sendMessage("OK we're gonna roll now, I want the captains to do !roll, higher roll will be considered Team 1");
    else if (allowed === "all")
        await mpChannel.sendMessage("OK we're gonna roll now, I want the stand-in captains to do !roll, higher roll will be considered Team 1");
    else if (allowed === "bot") {
        await mpChannel.sendMessage("OK we're gonna roll now, I'm gonna run !roll 2");
        await sleep(100);
        await mpChannel.sendMessage(`${state.matchups[ctx.state.matchupID].matchup.team1?.name} will be 1 and ${state.matchups[ctx.state.matchupID].matchup.team2?.name} will be 2`);
        await sleep(100);
        await mpChannel.sendMessage("!roll 2");
    }

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.$post("/:matchupID/first", async (ctx) => {
    const teamNumber = ctx.request.body.team;
    if (teamNumber !== 1 && teamNumber !== 2) {
        ctx.body = {
            success: false,
            error: "Invalid team number",
        };
        return;
    }

    const matchup = state.matchups[ctx.state.matchupID]?.matchup ?? await Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.team1", "team1")
        .innerJoinAndSelect("matchup.team2", "team2")
        .innerJoinAndSelect("matchup.sets", "sets")
        .where("matchup.ID = :id", { id: ctx.state.matchupID })
        .getOne();
    if (!matchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    if (!matchup.sets) {
        ctx.body = {
            success: false,
            error: "Matchup has no sets",
        };
        return;
    }

    matchup.sets[matchup.sets.length - 1].first = teamNumber === 1 ? matchup.team1 : matchup.team2;
    await matchup.sets[matchup.sets.length - 1].save();

    publish(`matchup:${matchup.ID}`, {
        type: "first",
        first: matchup.sets[matchup.sets.length - 1].first?.ID,
    });

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.$post("/:matchupID/invite", async (ctx) => {
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

banchoRefereeRouter.$post("/:matchupID/addRef", async (ctx) => {
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

banchoRefereeRouter.$post("/:matchupID/selectMap", async (ctx) => {
    const mapID = ctx.request.body.mapID;
    if (!mapID || typeof mapID !== "number" || isNaN(mapID)) {
        ctx.body = {
            success: false,
            error: "Invalid map ID",
        };
        return;
    }

    const matchup = state.matchups[ctx.state.matchupID]?.matchup ?? await Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.sets", "sets")
        .innerJoinAndSelect("sets.maps", "setMaps")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.mappool", "mappool")
        .innerJoinAndSelect("mappool.slots", "slots")
        .innerJoinAndSelect("slots.maps", "slotMaps")
        .where("matchup.ID = :id", { id: ctx.state.matchupID })
        .getOne();
    if (!matchup) {
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

    const slot = matchup.stage!.mappool!.flatMap(pool => pool.slots).find(poolSlot => poolSlot.maps.some(map => map.ID === mapID));
    if (!slot) {
        ctx.body = {
            success: false,
            error: "Slot not found",
        };
        return;
    }

    const map = slot.maps.find(mapSlot => mapSlot.ID === mapID);
    if (!map) {
        ctx.body = {
            success: false,
            error: "Map not found",
        };
        return;
    }

    if (!matchup.sets?.[set]) {
        ctx.body = {
            success: false,
            error: "Set not found",
        };
        return;
    }

    if (status !== 2) {
        // Add map to matchup.maps
        if (!matchup.sets[set].maps)
            matchup.sets[set].maps = [];
        const matchupMap = new MatchupMap();
        matchupMap.map = map;
        matchupMap.set = matchup.sets[set];
        matchupMap.status = status;
        matchupMap.order = matchup.sets[set].maps!.length + 1;
        await matchupMap.save();
        matchup.sets[set].maps!.push(matchupMap);

        publish(`matchup:${matchup.ID}`, {
            type: "selectMap",
            map: {
                ID: matchupMap.ID,
                map,
                order: matchupMap.order,
                status: matchupMap.status,
                scores: [],
            },
        });
    } else if (state.matchups[ctx.state.matchupID]?.lobby) {
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

banchoRefereeRouter.$post<{ mapID: number }>("/:matchupID/deleteMap", async (ctx) => {
    const mapID = ctx.request.body.mapID;
    if (!mapID || typeof mapID !== "number" || isNaN(mapID)) {
        ctx.body = {
            success: false,
            error: "Invalid map ID",
        };
        return;
    }

    const matchup = state.matchups[ctx.state.matchupID]?.matchup ?? await Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.sets", "sets")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.mappool", "mappool")
        .innerJoinAndSelect("mappool.slots", "slots")
        .innerJoinAndSelect("slots.maps", "maps")
        .where("matchup.ID = :id", { id: ctx.state.matchupID })
        .getOne();
    if (!matchup) {
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

    if (!matchup.sets?.[set]) {
        ctx.body = {
            success: false,
            error: "Set not found",
        };
        return;
    }

    const matchupMap = matchup.sets[set].maps?.find(map => map.ID === mapID);
    if (!matchupMap) {
        ctx.body = {
            success: false,
            error: "Map not found",
        };
        return;
    }

    try {
        await ormConfig.transaction(async manager => {
            matchup.sets![set].maps = matchup.sets![set].maps!.filter(map => map.ID !== mapID);
            matchup.sets![set].maps!.forEach((map, i) => map.order = i + 1);

            await manager.remove(matchupMap);
            await Promise.all(matchup.sets![set].maps!.map(map => manager.save(map)));

            if (state.matchups[ctx.state.matchupID]?.lobby)
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

banchoRefereeRouter.$post("/:matchupID/startMap", async (ctx) => {
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

banchoRefereeRouter.$post("/:matchupID/timer", async (ctx) => {
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

banchoRefereeRouter.$post("/:matchupID/settings", async (ctx) => {
    if (!state.matchups[ctx.state.matchupID]) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    const mpLobby = state.matchups[ctx.state.matchupID].lobby;
    await mpLobby.updateSettings();

    publish(`matchup:${state.matchups[ctx.state.matchupID].matchup.ID}`, {
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

banchoRefereeRouter.$post("/:matchupID/abortMap", async (ctx) => {
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

banchoRefereeRouter.$post("/:matchupID/message", async (ctx) => {
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

banchoRefereeRouter.$post("/:matchupID/forfeit", async (ctx) => {
    const teamForfeitNumber = ctx.request.body.team;
    if (teamForfeitNumber !== 1 && teamForfeitNumber !== 2) {
        ctx.body = {
            success: false,
            error: "Invalid team number",
        };
        return;
    }

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.team1", "team1")
        .innerJoinAndSelect("matchup.team2", "team2")
        .leftJoinAndSelect("matchup.sets", "set")
        .leftJoinAndSelect("matchup.stage", "stage")
        .leftJoinAndSelect("matchup.round", "round")
        .leftJoinAndSelect("stage.mapOrder", "stageMapOrder")
        .leftJoinAndSelect("round.mapOrder", "roundMapOrder")
        .leftJoinAndSelect("round.stage", "roundStage")
        .where("matchup.ID = :id", { id: ctx.state.matchupID })
        .getOne();

    if (!matchup) {
        ctx.body = {
            success: false,
            error: "Matchup not found",
        };
        return;
    }

    matchup.forfeit = true;
    matchup.winner = teamForfeitNumber === 1 ? matchup.team2 : matchup.team1;
    let firstSet = matchup.sets?.[0];
    if (!firstSet) {
        firstSet = new MatchupSet();
        firstSet.order = 1;
        firstSet.matchup = matchup;
        firstSet.maps = [];
        firstSet.team1Score = 0;
        firstSet.team2Score = 0;
    }

    const stage = matchup.stage ?? matchup.round?.stage;
    const baseMapOrder = matchup.stage?.mapOrder ?? matchup.round?.mapOrder;
    if (baseMapOrder && stage && stage.stageType === StageType.Roundrobin) {
        const mapOrder = baseMapOrder.map(o => o.set)
            .filter((v, i, a) => a.indexOf(v) === i)
            .map(s => ({
                set: s,
                order: baseMapOrder.filter(o => o.set === s).sort((a, b) => a.order - b.order) ?? [],
            }));
        if (mapOrder.length > 1) {
            const firstTo = (mapOrder.length + 1) / 2;
            firstSet.team1Score = teamForfeitNumber === 1 ? 0 : firstTo;
            firstSet.team2Score = teamForfeitNumber === 2 ? 0 : firstTo;
        } else {
            const firstTo = mapOrder[0].order.filter(o => o.status === MapStatus.Picked).length / 2 + 1;
            firstSet.team1Score = teamForfeitNumber === 1 ? 0 : firstTo;
            firstSet.team2Score = teamForfeitNumber === 2 ? 0 : firstTo;
        }
    } else {
        firstSet.team1Score = teamForfeitNumber === 1 ? 0 : 1;
        firstSet.team2Score = teamForfeitNumber === 2 ? 0 : 1;
    }
    await firstSet.save();

    matchup.team1Score = teamForfeitNumber === 1 ? 0 : 1;
    matchup.team2Score = teamForfeitNumber === 2 ? 0 : 1;
    await matchup.save();

    // assignTeamsToNextMatchup is run in bancho's runMatchup if there is a lobby running, so it's only run here if there's no lobby at all
    if (state.matchups[ctx.state.matchupID]) {
        state.matchups[ctx.state.matchupID].matchup = matchup;
        await state.matchups[ctx.state.matchupID].lobby.closeLobby();
    } else
        await assignTeamsToNextMatchup(matchup.ID);

    ctx.body = {
        success: true,
    };
});

banchoRefereeRouter.$post("/:matchupID/closeLobby", async (ctx) => {
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
