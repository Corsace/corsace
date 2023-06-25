import { randomUUID } from "crypto";
import { ScoringMethod } from "../../Models/tournaments/stage";
import { Matchup } from "../../Models/tournaments/matchup";
import { StageType } from "../../Models/tournaments/stage";
import { banchoClient, osuClient } from "../../Server/osu";
import { BanchoChannel, BanchoLobby, BanchoLobbyPlayer, BanchoLobbyTeamModes, BanchoLobbyWinConditions } from "bancho.js";
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

async function loadNextBeatmap (matchup: Matchup, mpLobby: BanchoLobby, mpChannel: BanchoChannel, pools: Mappool[]): Promise<Beatmap | null> {
    return new Promise((resolve, reject) => {
        if (matchup.stage!.stageType === StageType.Qualifiers) {
            const pool = pools[0];
            if (!matchup.stage!.qualifierTeamChooseOrder) {
                const beatmaps = pool.slots.flatMap(slot => slot.maps).filter(map => !matchup.maps!.some(matchMap => matchMap.map.ID === map.beatmap?.ID));
                if (beatmaps.length === 0)
                    return resolve(null);

                if (!beatmaps[0].beatmap)
                    return reject("Beatmap is not loaded");

                return resolve(beatmaps[0].beatmap);
            }

            mpChannel.on("message", async (message) => {
                const isManagerMessage = (
                    matchup.stage?.stageType === StageType.Qualifiers &&
                    matchup.teams?.some(team => team.manager.osu.userID === message.user.id.toString())
                ) || [matchup.team1, matchup.team2].some(team => team?.manager.osu.userID === message.user.id.toString());
                
                if (!isManagerMessage) 
                    return;
            
                const contentParts = message.content.split(" ");
                const command = contentParts[0];
                const param = ["!map", "!pick"].includes(command) ? contentParts[1] : command;
                
                const mapById = (id: number) => pool.slots.flatMap(slot => slot.maps).find(map => map.beatmap?.ID === id);
                const mapBySlotOrder = (slot: MappoolSlot, order: number) => slot.maps.find(map => map.order === order);
                
                const id = parseInt(param);
                let map: MappoolMap | undefined;
            
                if (isNaN(id)) {
                    const order = parseInt(param.slice(-1));
                    const slot = pool.slots.find(slot => param.toLowerCase().includes(slot.acronym.toLowerCase()));
                    
                    if (!slot) 
                        return await mpChannel.sendMessage("Invalid map ID or slot");
                    if (isNaN(order) && slot.maps.length > 1) 
                        return await mpChannel.sendMessage("Slot has multiple maps, please specify a map #");
            
                    map = mapBySlotOrder(slot, isNaN(order) ? 1 : order);
                } else
                    map = mapById(id);
            
                if (!map) 
                    return await mpChannel.sendMessage("Invalid map ID");
                if (!map.beatmap) 
                    return reject("Map is missing beatmap CONTACT CORSACE IMMEDIATELY");
            
                return resolve(map.beatmap);
            });
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
    const aborts = new Map<number, number>();

    // Close lobby 15 minutes after matchup time if not all managers had joined
    setTimeout(async () => {
        if (started)
            return;
        
        await mpLobby.closeLobby();
        await mpChannel.sendMessage("Matchup lobby closed due to managers not joining");
    }, matchup.date.getTime() - Date.now() + 15 * 60 * 1000);

    mpChannel.on("message", async (message) => {
        matchup.log += message.content;
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

        if (started || mpLobby.playing)
            return;

        playersInLobby.push(newPlayer);
        const members = Array.from(mpChannel.channelMembers, ([, member]) => member);
        if (
            (
                matchup.stage!.stageType === StageType.Qualifiers &&
                matchup.teams!.some(team => !members.some(m => m.user.id.toString() === team.manager.osu.userID))
            ) ||
            (
                !members.some(m => m.user.id.toString() === matchup.team1!.manager.osu.userID) &&
                !members.some(m => m.user.id.toString() === matchup.team2!.manager.osu.userID)
            )
        ) {
            await mpChannel.sendMessage(`Yo ${newPlayer.user.username} we're just waiting for all the ${matchup.stage!.tournament.matchupSize === 1 ? "players" : "managers"} to be in here and then we'll start the match`);
            return;
        }

        started = true;
        await mpChannel.sendMessage("OK WE;'RE STARTING THE MATCH let's go");

        try {
            const beatmap = await loadNextBeatmap(matchup, mpLobby, mpChannel, pools);
            if (!beatmap) {
                await mpChannel.sendMessage("No maps found? If this was a mistake CONTACT CORSACE IMMEDIATELY");
                return;
            }

            await mpLobby.setMap(beatmap.ID);
        } catch (ex) {
            if (ex) await mpChannel.sendMessage(`Error loading beatmap: ${ex}`);
        }
    });

    // Player left event
    mpLobby.on("playerLeft", async (player) => {
        
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
                )
            ) {
                await Promise.all([
                    mpLobby.abortMatch(),
                    mpChannel.sendMessage(`${player.user.username} left the match so we're aborting`),
                ]);
                aborts.set(team.ID, (aborts.get(team.ID) || 0) + 1);
            }
        }

        playersInLobby = playersInLobby.filter(p => p.user.id !== player.user.id);
    });

    // All players ready event
    mpLobby.on("allPlayersReady", async () => {
        if (mapsPlayed.some(m => m.beatmap!.ID === mpLobby.beatmapId))
            return;
        
        if (
            (
                matchup.stage!.stageType === StageType.Qualifiers &&
                !matchup.teams!.map(team => 
                    team.members.filter(m => 
                        playersInLobby.some(p => p.user.id.toString() === m.osu.userID)
                    ).length
                ).every(n => n === matchup.stage!.tournament.matchupSize)
            ) ||
            (
                matchup.team1!.members.filter(m =>
                    playersInLobby.some(p => p.user.id.toString() === m.osu.userID)
                ).length !== matchup.stage!.tournament.matchupSize ||
                matchup.team2!.members.filter(m =>
                    playersInLobby.some(p => p.user.id.toString() === m.osu.userID)
                ).length !== matchup.stage!.tournament.matchupSize
            ) 
        ) {
            await mpChannel.sendMessage("bruh just cuz ur all ready doesnt mean anything if not enough players in each team to start yet hrur y up");
            return;
        }
    
        await mpLobby.startMatch(10);
    });

    mpLobby.on("matchAborted", async () => {
        mapsPlayed = mapsPlayed.filter(m => m.beatmap!.ID !== mpLobby.beatmapId);
    });

    mpLobby.on("matchStarted", async () => {
        const beatmap = pools.flatMap(pool => pool.slots.flatMap(slot => slot.maps)).find(map => map.beatmap!.ID === mpLobby.beatmapId);
        if (!beatmap) {
            await mpLobby.abortMatch();
            await mpChannel.sendMessage("YO HOLD UP I can't find the map in the pool(s) for some reason GET CORSACE STAFF IMNMEDIATRELY");
            return;
        }
        mapsPlayed.push(beatmap);
    });

    mpLobby.on("matchFinished", async () => {
        const beatmap = mapsPlayed[mapsPlayed.length - 1];
        const matchupMap = new MatchupMap(matchup, beatmap);
        matchupMap.order = mapsPlayed.length;
        await matchupMap.save();

        const mp = await osuClient.multi.getMatch(mpLobby.id) as Multi;
        const scores = mp.games[mp.games.length - 1].scores;

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
            matchupScore.accuracy = (score.count50 + 2 * score.count100 + 6 * score.count300) / (6 * (score.count50 + score.count100 + score.count300));
            matchupScore.fullCombo = score.perfect || score.maxCombo === beatmap.beatmap!.maxCombo;
            return matchupScore.save();
        }));

        await matchupMap.save();
        matchup.maps!.push(matchupMap);
        await matchup.save();

        try {
            const beatmap = await loadNextBeatmap(matchup, mpLobby, mpChannel, pools);
            if (!beatmap) {
                await mpChannel.sendMessage("No more maps to play, closing lobby in 15 seconds");
                setTimeout(async () => {
                    await mpLobby.closeLobby();
                }, 15 * 1000);
                return;
            }

            await mpLobby.setMap(beatmap.ID);
        } catch (ex) {
            if (ex) await mpChannel.sendMessage(`Error loading beatmap: ${ex}`);
        }
    });
}

export default async function runMatch (matchup: Matchup, replace = false) {
    runMatchCheck(matchup, replace);

    let lobbyName = `${matchup.stage!.tournament.abbreviation}: (${matchup.team1?.name} vs ${matchup.team2?.name})`;
    if (matchup.stage!.stageType === StageType.Qualifiers)
        lobbyName = `${matchup.stage!.tournament.abbreviation}: ${convertDateToDDDHH(matchup.date)} Qualifiers`;

    const mpChannel = await banchoClient.createLobby(lobbyName, false);
    const mpLobby = mpChannel.lobby;

    matchup.log = "";
    matchup.maps = [];

    const requiredPlayerAmount = Math.min(16, 1 + matchup.stage!.tournament.matchupSize * (matchup.teams?.length || 2));

    await Promise.all([
        mpLobby.setPassword(randomUUID()),
        mpLobby.setSettings(
            matchup.stage!.stageType === StageType.Qualifiers ? BanchoLobbyTeamModes.HeadToHead : BanchoLobbyTeamModes.TeamVs, 
            winConditions[matchup.stage!.stageType] || BanchoLobbyWinConditions.ScoreV2, 
            requiredPlayerAmount
        ),
        mpLobby.addRef([matchup.stage!.tournament.organizer.osu.userID, matchup.referee?.osu.userID || "", matchup.streamer?.osu.userID || ""]),
    ]);

    if (matchup.stage!.stageType === StageType.Qualifiers)
        await Promise.all(matchup.teams!.flatMap(team => team.members.map(m => mpLobby.invitePlayer(m.osu.userID)).concat(mpLobby.invitePlayer(team.manager.osu.userID))));
    else
        await Promise.all(
            matchup.team1!.members.map(m => mpLobby.invitePlayer(m.osu.userID))
                .concat(mpLobby.invitePlayer(matchup.team1!.manager.osu.userID))
                .concat(matchup.team2!.members.map(m => mpLobby.invitePlayer(m.osu.userID)))
                .concat(mpLobby.invitePlayer(matchup.team2!.manager.osu.userID))
        );

    await runMatchListeners(matchup, mpLobby, mpChannel);
}