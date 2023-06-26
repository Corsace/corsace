import { randomUUID } from "crypto";
import { ScoringMethod } from "../../Models/tournaments/stage";
import { Matchup } from "../../Models/tournaments/matchup";
import { StageType } from "../../Models/tournaments/stage";
import { banchoClient, osuClient } from "../../Server/osu";
import { BanchoChannel, BanchoLobby, BanchoLobbyPlayer, BanchoLobbyTeamModes, BanchoLobbyWinConditions, BanchoMessage, BanchoMods } from "bancho.js";
import { convertDateToDDDHH } from "../../Server/utils/dateParse";
import { MappoolMap } from "../../Models/tournaments/mappools/mappoolMap";
import { MatchupMap } from "../../Models/tournaments/matchupMap";
import { MatchupScore } from "../../Models/tournaments/matchupScore";
import { Multi } from "nodesu";
import { Team } from "../../Models/tournaments/team";
import { Mappool } from "../../Models/tournaments/mappools/mappool";
import { MappoolSlot } from "../../Models/tournaments/mappools/mappoolSlot";
import { Beatmap } from "../../Models/beatmap";

const winConditions = {
    [ScoringMethod.ScoreV2]:    BanchoLobbyWinConditions.ScoreV2,
    [ScoringMethod.ScoreV1]:    BanchoLobbyWinConditions.Score,
    [ScoringMethod.Accuracy]:   BanchoLobbyWinConditions.Accuracy,
    [ScoringMethod.Combo]:      BanchoLobbyWinConditions.Combo,
};

const leniencyTime = 10 * 1000;

function log (matchup: Matchup, message: string) {
    console.log(`[Matchup ${matchup.ID}] ${message}`);
}

function runMatchCheck (matchup: Matchup, replace: boolean) {
    if (!matchup.stage)
        throw new Error("Matchup has no stage");
    if (
        (!matchup.teams && matchup.stage.stageType === StageType.Qualifiers) ||
        (!matchup.team1 || !matchup.team2) && matchup.stage.stageType !== StageType.Qualifiers
    )
        throw new Error("Matchup has no teams");
    if (matchup.winner)
        throw new Error("Matchup already has a winner");
    if (matchup.mp && !replace)
        throw new Error("Matchup is already assigned to an mp ID");
    if (!matchup.round?.mappool && !matchup.stage.mappool)
        throw new Error("Matchup is missing mappool");
}

function isPlayerInMatchup (matchup: Matchup, playerID: string, checkManager: boolean): boolean {
    const isPlayerInTeam = (team: Team) => 
        (checkManager && team.manager.osu.userID === playerID) || 
        team.members.some(player => player.osu.userID === playerID);

    if (matchup.stage!.stageType === StageType.Qualifiers)
        return matchup.teams!.some(isPlayerInTeam);
    else
        return isPlayerInTeam(matchup.team1!) || isPlayerInTeam(matchup.team2!);
}

async function loadNextBeatmap (matchup: Matchup, mpLobby: BanchoLobby, mpChannel: BanchoChannel, pools: Mappool[]): Promise<[Beatmap, number | null | undefined, boolean] | null> {
    return new Promise((resolve, reject) => {
        if (matchup.stage!.stageType === StageType.Qualifiers) {
            const pool = pools[0];
            const beatmaps = pool.slots.flatMap(slot => slot.maps).filter(map => !matchup.maps!.some(matchMap => matchMap.map.beatmap?.ID === map.beatmap?.ID));
            if (!matchup.stage!.qualifierTeamChooseOrder || beatmaps.length === 1) {
                if (beatmaps.length === 0)
                    return resolve(null);

                if (!beatmaps[0].beatmap)
                    return reject("Beatmap doesn't exist CONTACT CORSACE IMMEDIATELY");

                const slotMod = pool.slots.find(slot => slot.maps.some(map => map.beatmap?.ID === beatmaps[0].beatmap?.ID))!;
                return resolve([beatmaps[0].beatmap, slotMod.allowedMods, slotMod.uniqueModCount === undefined || slotMod.userModCount === undefined]);
            }
            let gotBeatmap = false;
            const messageHandler = async (message: BanchoMessage) => {
                if (message.user.ircUsername === "BanchoBot" && message.content === "Countdown finished") {
                    setTimeout(() => {
                        if (gotBeatmap)
                            return;
                        if (beatmaps.length === 0)
                            return resolve(null);
                        if (!beatmaps[0].beatmap)
                            return reject("Beatmap doesn't exist CONTACT CORSACE IMMEDIATELY");

                        mpChannel.sendMessage("OK U GUYS ARE TAKING TOO LON g im picking a random map for all of u to play now GL");
                        const slotMod = pool.slots.find(slot => slot.maps.some(map => map.beatmap?.ID === beatmaps[0].beatmap?.ID))!;
                        mpChannel.removeListener("message", messageHandler);
                        return resolve([beatmaps[0].beatmap, slotMod.allowedMods, slotMod.uniqueModCount === undefined || slotMod.userModCount === undefined]);
                    }, leniencyTime);
                }

                const isManagerMessage = !message.self && message.user.id && (
                    (
                        matchup.stage?.stageType === StageType.Qualifiers &&
                        matchup.teams?.some(team => team.manager.osu.userID === message.user.id.toString())
                    ) || 
                    [matchup.team1, matchup.team2].some(team => team?.manager.osu.userID === message.user.id.toString()));
                
                if (!isManagerMessage) 
                    return;
            
                const contentParts = message.content.split(" ");
                const command = contentParts[0];
                const param = ["!map", "!pick"].includes(command) ? contentParts[1] : command;

                if (param.length > 4)
                    return;
                
                const mapById = (id: number) => beatmaps.find(map => map.beatmap!.ID === id);
                const mapBySlotOrder = (slot: MappoolSlot, order: number) => slot.maps.find(map => map.order === order);
                
                const id = parseInt(param);
                let map: MappoolMap | undefined;
            
                if (isNaN(id)) {
                    const nums = param.match(/\d+/g) || [];
                    const order = parseInt(nums[nums.length - 1]);
                    const slot = pool.slots.find(slot => param.toLowerCase().includes(slot.acronym.toLowerCase()));
                    
                    if (!slot) 
                        return;
                    if (isNaN(order) && slot.maps.length > 1) 
                        return await mpChannel.sendMessage(`Slot ${slot.acronym} has more than 1 map, specify a map #`);
            
                    map = mapBySlotOrder(slot, isNaN(order) ? 1 : order);
                } else
                    map = mapById(id);
            
                if (!map) 
                    return await mpChannel.sendMessage("The map ID or slot provided is INVALID .");
                if (!map.beatmap) 
                    return reject("Map is missing beatmap CONTACT CORSACE IMMEDIATELY");
            
                const slotMod = pool.slots.find(slot => slot.maps.some(slotMap => slotMap.beatmap!.ID === map!.beatmap!.ID))!;
                
                if (!beatmaps.some(beatmap => beatmap.beatmap!.ID === map!.beatmap!.ID))
                    return await mpChannel.sendMessage(`${slotMod.acronym}${map.order} is ALREADY PLAYED .`);

                gotBeatmap = true;
                mpChannel.removeListener("message", messageHandler);
                return resolve([map.beatmap, slotMod.allowedMods, slotMod.uniqueModCount === undefined || slotMod.userModCount === undefined]);
            };

            mpChannel.sendMessage("It's time to pick a map!!11!1");
            mpLobby.startTimer(matchup.stage!.tournament.mapTimer || 90);
            mpChannel.on("message", messageHandler);
        } else {
            // TODO: implement this
            reject("Not implemented");
        }
    });
}

async function runMatchListeners (matchup: Matchup, mpLobby: BanchoLobby, mpChannel: BanchoChannel) {
    const pools = matchup.round?.mappool || matchup.stage!.mappool!;
    let playersInLobby: BanchoLobbyPlayer[] = [];
    let mapsPlayed: MappoolMap[] = [];
    let started = false;
    let matchStart: Date | undefined = undefined;
    const aborts = new Map<number, number>();
    const autoStart = async (message: BanchoMessage) => {
        if (message.user.ircUsername === "BanchoBot" && (message.content === "All players are ready" || message.content === "Countdown finished")) {
            mpChannel.removeListener("message", autoStart);
            if (message.content === "Countdown finished") {
                await mpChannel.sendMessage("u guys are taking WAY TOO LONG TO READY UP im starting the match now");          
                setTimeout(async () => {
                    await mpLobby.startMatch(5);
                }, leniencyTime);
            }
        }
    };

    // Close lobby 15 minutes after matchup time if not all managers had joined
    setTimeout(async () => {
        if (started)
            return;
        
        await mpLobby.closeLobby();
        await mpChannel.sendMessage("Matchup lobby closed due to managers not joining");
        
        matchup.mp = mpLobby.id;
        await matchup.save();
    }, matchup.date.getTime() - Date.now() + 15 * 60 * 1000);

    mpChannel.on("message", async (message) => {
        matchup.log += `\n${message.content}`;
        await matchup.save();

        if (message.self)
            return;
    });

    // Player joined event
    mpLobby.on("playerJoined", async (joinInfo) => {
        const newPlayer = joinInfo.player;
        const newPlayerID = newPlayer.user.id.toString();
        if (!isPlayerInMatchup(matchup, newPlayerID, true)) {
            await Promise.all([
                mpLobby.kickPlayer(newPlayerID),
                mpLobby.setPassword(randomUUID()),
                (await banchoClient.getUserById(newPlayer.user.id)).sendMessage("Bruh u aint part of this matchup"),
            ]);
            return;
        }

        playersInLobby.push(newPlayer);
        log(matchup, `Player ${newPlayer.user.username} joined the lobby`);

        if (started || mpLobby.playing)
            return;

        if (
            (
                matchup.stage!.stageType === StageType.Qualifiers &&
                matchup.teams!.some(team => !mpLobby.slots.some(m => m.user.id.toString() === team.manager.osu.userID))
            ) ||
            (
                matchup.stage!.stageType !== StageType.Qualifiers &&
                !mpLobby.slots.some(m => m.user.id?.toString() === matchup.team1!.manager.osu.userID) &&
                !mpLobby.slots.some(m => m.user.id?.toString() === matchup.team2!.manager.osu.userID)
            )
        ) {
            await mpChannel.sendMessage(`Yo ${newPlayer.user.username} we're just waiting for all the ${matchup.stage!.tournament.matchupSize === 1 ? "players" : "managers"} to be in here and then we'll start the match`);
            return;
        }

        started = true;
        await mpChannel.sendMessage("OK WE;'RE STARTING THE MATCH let's go");

        try {
            log(matchup, "Picking map");
            const nextBeatmapInfo = await loadNextBeatmap(matchup, mpLobby, mpChannel, pools);
            if (!nextBeatmapInfo) {
                await mpChannel.sendMessage("No maps found? This is probably a mistake CONTACT CORSACE IMMEDIATELY");
                log(matchup, "No maps found at beginning of matchup");
                return;
            }

            const mods = BanchoMods.parseBitFlags(nextBeatmapInfo[1] || 1, true).concat(BanchoMods.NoFail).filter((v, i, a) => a.findIndex(m => m.enumValue === v.enumValue) === i);
            await Promise.all([
                mpLobby.setMap(nextBeatmapInfo[0].ID),
                mpLobby.setMods(mods, nextBeatmapInfo[2]),
            ]);
            await mpLobby.startTimer(matchup.stage!.tournament.readyTimer || 90);
            log(matchup, `Map picked: ${nextBeatmapInfo[0].ID} with mods ${BanchoMods.returnBitFlags(mods)}`);
            mpChannel.on("message", autoStart);
        } catch (ex) {
            if (ex) {
                await mpChannel.sendMessage(`Error loading beatmap: ${ex}`);
                log(matchup, `Error loading beatmap: ${ex}`);
            }
        }
    });

    // Player left event
    mpLobby.on("playerLeft", async (player) => {
        log(matchup, `Player ${player.user.username} left the lobby`);
        playersInLobby = playersInLobby.filter(p => p.user.id !== player.user.id);

        if (
            mpLobby.playing &&
            playersInLobby.some(p => p.user.id === player.user.id)
        ) {
            const team = matchup.teams!.find(team => team.members.some(m => m.osu.userID === player.user.id.toString()));
            if (
                (team && 
                    (
                        aborts.get(team.ID) === undefined || 
                        !matchup.stage!.tournament.teamAbortLimit || 
                        aborts.get(team.ID)! <= matchup.stage!.tournament.teamAbortLimit
                    )
                ) && (
                    matchStart && 
                    Date.now() - matchStart.getTime() < (matchup.stage!.tournament.abortThreshold || 15) * 1000
                )
            ) {
                await Promise.all([
                    mpLobby.abortMatch(),
                    mpChannel.sendMessage(`${player.user.username} left the match so we're aborting`),
                ]);
                aborts.set(team.ID, (aborts.get(team.ID) || 0) + 1);
            }
        }
    });

    // All players ready event
    mpLobby.on("allPlayersReady", async () => {
        if (mapsPlayed.some(m => m.beatmap!.ID === mpLobby.beatmapId))
            return;
        
        if (
            (
                matchup.stage!.stageType === StageType.Qualifiers &&
                !matchup.teams!.map(team => 
                    team.members.filter(m => playersInLobby.some(p => p.user.id.toString() === m.osu.userID)).length
                ).every(n => n === matchup.stage!.tournament.matchupSize)
            ) ||
            (
                matchup.stage!.stageType !== StageType.Qualifiers &&
                (
                    matchup.team1!.members.filter(m =>
                        playersInLobby.some(p => p.user.id.toString() === m.osu.userID)
                    ).length !== matchup.stage!.tournament.matchupSize ||
                    matchup.team2!.members.filter(m =>
                        playersInLobby.some(p => p.user.id.toString() === m.osu.userID)
                    ).length !== matchup.stage!.tournament.matchupSize
                )
            ) 
        ) {
            await mpChannel.sendMessage("bruh just cuz ur all ready doesnt mean anything if not enough players are in each team to start yet hrur y up");
            return;
        }

        log(matchup, "All players readied up for the next map");
        await mpLobby.startMatch(5);

        const abort = async () => {
            await mpLobby.abortTimer();
            await mpLobby.removeListener("playerLeft", abort);
        };

        mpLobby.on("playerLeft", abort);
    });

    mpLobby.on("matchAborted", async () => {
        log(matchup, "Match aborted");
        matchStart = undefined;
        mapsPlayed = mapsPlayed.filter(m => m.beatmap!.ID !== mpLobby.beatmapId);

        setTimeout(async () => {
            await mpChannel.sendMessage("Get ur shit together and ready up u got 30 seconds");
            await mpLobby.startTimer(30);
            mpChannel.on("message", autoStart);
        }, leniencyTime);
    });

    mpLobby.on("matchStarted", async () => {
        log(matchup, "Match started");
        matchStart = new Date();
        const beatmap = pools.flatMap(pool => pool.slots.flatMap(slot => slot.maps)).find(map => map.beatmap!.ID === mpLobby.beatmapId);
        if (!beatmap) {
            await mpLobby.abortMatch();
            await mpChannel.sendMessage("YO HOLD UP I can't find the map in the pool(s) for some reason GET CORSACE STAFF IMNMEDIATRELY");
            log(matchup, `Couldn't find map ${mpLobby.beatmapId} in the pools`);
            return;
        }
        mapsPlayed.push(beatmap);
    });

    mpLobby.on("matchFinished", async () => {
        const beatmap = mapsPlayed[mapsPlayed.length - 1];
        const mp = await osuClient.multi.getMatch(mpLobby.id) as Multi;
        const scores = mp.games[mp.games.length - 1].scores;

        if (scores.length === 0 || (scores.length === 1 && scores[0].count300 + scores[0].count100 + scores[0].count50 + scores[0].countMiss < (beatmap.beatmap!.maxCombo || 0) && Date.now() - matchStart!.getTime() < (matchup.stage!.tournament.abortThreshold || 15) * 1000)) {
            mpLobby.emit("matchAborted");
            return;
        }

        log(matchup, "Match finished");
        matchStart = undefined;

        const matchupMap = new MatchupMap(matchup, beatmap);
        matchupMap.order = mapsPlayed.length;
        await matchupMap.save();

        const users = matchup.stage!.stageType === StageType.Qualifiers ? matchup.teams!.flatMap(team => team.members) : matchup.team1!.members.concat(matchup.team2!.members);
        matchupMap.scores = await Promise.all(scores.map(async (score) => {
            const user = users.find(u => u.osu.userID === score.userId.toString());
            if (!user) {
                await mpChannel.sendMessage(`YO I CAN'T FIND THE USER IN SLOT ${score.slot} (ID ${score.userId}) IN THE MATCHUP GET CORSACE STAFF IMMEDIATELY`);
                throw new Error("User not found");
            }
            const matchupScore = new MatchupScore(user);
            matchupScore.map = matchupMap;
            matchupScore.score = score.score;
            matchupScore.mods = score.enabledMods || 0;
            matchupScore.misses = score.countMiss;
            matchupScore.combo = score.maxCombo;
            matchupScore.fail = !score.pass;
            matchupScore.accuracy = (score.count50 + 2 * score.count100 + 6 * score.count300) / Math.max(6 * (score.count50 + score.count100 + score.count300), 1);
            matchupScore.fullCombo = score.perfect || score.maxCombo === beatmap.beatmap!.maxCombo;
            return matchupScore.save();
        }));

        await matchupMap.save();
        matchup.maps!.push(matchupMap);
        await matchup.save();

        log(matchup, `Matchup map and scores saved with matchupMap ID ${matchupMap.ID}`);

        setTimeout(async () => {
            try {
                log(matchup, "Picking map");

                const nextBeatmapInfo = await loadNextBeatmap(matchup, mpLobby, mpChannel, pools);
                if (!nextBeatmapInfo) {
                    await mpChannel.sendMessage(`No more maps to play, closing lobby in ${leniencyTime / 1000} seconds`);
                    setTimeout(async () => {
                        await mpLobby.closeLobby();
                        matchup.mp = mpLobby.id;
                        await matchup.save();
                    }, leniencyTime);
                    return;
                }

                const mods = BanchoMods.parseBitFlags(nextBeatmapInfo[1] || 1, true).concat(BanchoMods.NoFail).filter((v, i, a) => a.findIndex(m => m.enumValue === v.enumValue) === i);
                await Promise.all([
                    mpLobby.setMap(nextBeatmapInfo[0].ID),
                    mpLobby.setMods(mods, nextBeatmapInfo[2]),
                ]);
                await mpLobby.startTimer(matchup.stage!.tournament.readyTimer || 90);
                log(matchup, `Map picked: ${nextBeatmapInfo[0].ID} with mods ${BanchoMods.returnBitFlags(mods)}`);
                mpChannel.on("message", autoStart);
            } catch (ex) {
                if (ex) {
                    await mpChannel.sendMessage(`Error loading beatmap: ${ex}`);
                    log(matchup, `Error loading beatmap: ${ex}`);
                }
            }
        }, matchup.streamer ? 30 * 1000 : 0);
    });
}

export default async function runMatch (matchup: Matchup, replace = false) {
    runMatchCheck(matchup, replace);

    let lobbyName = `${matchup.stage!.tournament.abbreviation}: (${matchup.team1?.name} vs ${matchup.team2?.name})`;
    if (matchup.stage!.stageType === StageType.Qualifiers)
        lobbyName = `${matchup.stage!.tournament.abbreviation}: ${convertDateToDDDHH(matchup.date)} Qualifiers`;

    log(matchup, `Creating lobby with name ${lobbyName}`);
    const mpChannel = await banchoClient.createLobby(lobbyName, false);
    const mpLobby = mpChannel.lobby;
    log(matchup, `Created lobby with name ${lobbyName} and ID ${mpLobby.id}`);

    matchup.log = "";
    matchup.maps = [];

    const requiredPlayerAmount = Math.min(16, 1 + matchup.stage!.tournament.matchupSize * (matchup.teams?.length || 2));

    log(matchup, `Setting lobby settings, password and adding refs`);
    await Promise.all([
        mpLobby.setPassword(randomUUID()),
        mpLobby.setSettings(
            matchup.stage!.stageType === StageType.Qualifiers ? BanchoLobbyTeamModes.HeadToHead : BanchoLobbyTeamModes.TeamVs, 
            winConditions[matchup.stage!.stageType] || BanchoLobbyWinConditions.ScoreV2, 
            requiredPlayerAmount
        ),
        mpLobby.addRef([matchup.stage!.tournament.organizer.osu.userID, matchup.referee?.osu.userID || "", matchup.streamer?.osu.userID || ""]),
    ]);
    log(matchup, `Set lobby settings, password and added refs`);

    log(matchup, `Inviting players`);
    if (matchup.stage!.stageType === StageType.Qualifiers) {
        const users = matchup.teams!.flatMap(team => team.members.concat(team.manager).filter((v, i, a) => a.findIndex(t => t.ID === v.ID) === i));
        await Promise.all(users.map(user => mpLobby.invitePlayer(`#${user.osu.userID}`)));
    } else {
        const users = matchup.team1!.members.concat(matchup.team1!.manager).concat(matchup.team2!.members).concat(matchup.team2!.manager).filter((v, i, a) => a.findIndex(t => t.ID === v.ID) === i);
        await Promise.all(users.map(m => mpLobby.invitePlayer(`#${m.osu.userID}`)));
    }
    log(matchup, `Invited players`);

    await runMatchListeners(matchup, mpLobby, mpChannel);
}