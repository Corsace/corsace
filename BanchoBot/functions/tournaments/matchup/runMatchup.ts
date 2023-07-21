import { randomUUID } from "crypto";
import { banchoClient, maybeShutdown } from "../../..";
import state from "../../../state";
import { leniencyTime } from "../../../../Models/tournaments/stage";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { StageType, ScoringMethod } from "../../../../Interfaces/stage";
import { osuClient } from "../../../../Server/osu";
import { BanchoChannel, BanchoLobby, BanchoLobbyPlayer, BanchoLobbyTeamModes, BanchoLobbyWinConditions } from "bancho.js";
import { convertDateToDDDHH } from "../../../../Server/utils/dateParse";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { MatchupMap } from "../../../../Models/tournaments/matchupMap";
import { MatchupScore } from "../../../../Models/tournaments/matchupScore";
import { Multi } from "nodesu";
import allAllowedUsersForMatchup from "./allAllowedUsersForMatchup";
import allPlayersInMatchup from "./allPlayersInMatchup";
import areAllPlayersInAssignedSlots from "./areAllPlayersInAssignedSlots";
import doAllPlayersHaveCorrectMods from "./doAllPlayersHaveCorrectMods";
import getMappoolSlotMods from "./getMappoolSlotMods";
import getUserInMatchup from "./getUserInMatchup";
import invitePlayersToLobby from "./invitePlayersToLobby";
import isPlayerInMatchup from "./isPlayerInMatchup";
import loadNextBeatmap from "./loadNextBeatmap";
import { MatchupMessage } from "../../../../Models/tournaments/matchupMessage";

const winConditions = {
    [ScoringMethod.ScoreV2]: BanchoLobbyWinConditions.ScoreV2,
    [ScoringMethod.ScoreV1]: BanchoLobbyWinConditions.Score,
    [ScoringMethod.Accuracy]: BanchoLobbyWinConditions.Accuracy,
    [ScoringMethod.Combo]: BanchoLobbyWinConditions.Combo,
};

function log (matchup: Matchup, message: string) {
    console.log(`[Matchup ${matchup.ID}] ${message}`);
}

function runMatchupCheck (matchup: Matchup, replace: boolean) {
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

async function runMatchupListeners (matchup: Matchup, mpLobby: BanchoLobby, mpChannel: BanchoChannel) {
    state.runningMatchups++;

    let autoStart = false;
    let mapsPlayed: MappoolMap[] = [];
    let mapTimerStarted = false;
    let matchStart: Date | undefined = undefined;
    let playersInLobby: BanchoLobbyPlayer[] = [];
    let playersPlaying: BanchoLobbyPlayer[] | undefined = undefined;
    let started = false;
    let lastMessageSaved = Date.now();
    const aborts = new Map<number, number>();
    const pools = matchup.round?.mappool || matchup.stage!.mappool!;
    const users = await allAllowedUsersForMatchup(matchup);
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Periodically save messages every 15 seconds
    const messageSaver = setInterval(async () => {
        const messagesToSave = matchup.messages!.filter((message) => message.timestamp.getTime() > lastMessageSaved);
        await MatchupMessage
            .createQueryBuilder("message")
            .insert()
            .values(messagesToSave)
            .execute();

        lastMessageSaved = matchup.messages![matchup.messages!.length - 1].timestamp.getTime();
    }, 15 * 1000);

    // Close lobby 15 minutes after matchup time if not all managers had joined
    setTimeout(async () => {
        if (started)
            return;

        await mpChannel.sendMessage("Matchup lobby closed due to managers not joining");
        await mpLobby.closeLobby();
    }, matchup.date.getTime() - Date.now() + 15 * 60 * 1000);

    mpChannel.on("message", async (message) => {
        const user = await getUserInMatchup(users, message);
        const matchupMessage = new MatchupMessage();
        matchupMessage.timestamp = new Date();
        matchupMessage.content = message.content;
        matchupMessage.matchup = matchup;
        matchupMessage.user = user;
        matchup.messages!.push(matchupMessage);

        if (message.self)
            return;

        if (message.user.ircUsername === "BanchoBot") { 
            if (
                message.content === "All players are ready" &&
                allPlayersInMatchup(matchup, playersInLobby) &&
                areAllPlayersInAssignedSlots(mpLobby, playersPlaying)
            )
                autoStart = false;
            else if (
                message.content === "Countdown finished" && autoStart
            ) {
                await mpChannel.sendMessage("u guys are taking WAY TOO LONG TO READY UP im starting the match now");
                setTimeout(async () => {
                    await mpLobby.startMatch(5);
                    mapTimerStarted = true;
                    autoStart = false;
                }, leniencyTime);
            }
        }
    });

    // Player joined event
    mpLobby.on("playerJoined", async (joinInfo) => {
        const newPlayer = joinInfo.player;
        const newPlayerID = newPlayer.user.id.toString();
        if (!isPlayerInMatchup(matchup, newPlayerID, true)) {
            await Promise.all([
                mpLobby.banPlayer(newPlayer.user.ircUsername),
                mpLobby.setPassword(randomUUID()),
                (await banchoClient.getUserById(newPlayer.user.id)).sendMessage("Bruh u aint part of this matchup"),
            ]);
            await invitePlayersToLobby(matchup, mpLobby),
            await mpChannel.sendMessage(`Changed the password and resent invites to everyone in the matchup due to ${newPlayer.user.ircUsername} joining when they shouldn't have (who leaked .)`);
            return;
        }

        playersInLobby.push(newPlayer);
        log(matchup, `Player ${newPlayer.user.username} joined the lobby`);

        if (started || mpLobby.playing)
            return;

        if (
            (
                matchup.stage!.stageType === StageType.Qualifiers &&
                matchup.teams!.some(team => !mpLobby.slots.some(m => m !== null && m.user.id.toString() === team.manager.osu.userID))
            ) ||
            (
                matchup.stage!.stageType !== StageType.Qualifiers &&
                !mpLobby.slots.some(m => m !== null && m.user.id.toString() === matchup.team1!.manager.osu.userID) &&
                !mpLobby.slots.some(m => m !== null && m.user.id.toString() === matchup.team2!.manager.osu.userID)
            )
        ) {
            await mpChannel.sendMessage(`Yo ${newPlayer.user.username} we're just waiting for all the ${matchup.stage!.tournament.matchupSize === 1 ? "players" : "managers"} to be in here and then we'll start the match`);
            return;
        }

        started = true;
        await mpChannel.sendMessage("OK WE;'RE STARTING THE MATCH let's go");

        try {
            log(matchup, "Picking map");
            await loadNextBeatmap(matchup, mpLobby, mpChannel, pools, false);
            log(matchup, `Map picked: ${mpLobby.beatmapId} with mods ${mpLobby.mods.map(mod => mod.shortMod).join(", ")}`);
            autoStart = true;
        } catch (ex) {
            await mpChannel.sendMessage(`Error loading beatmap: ${ex}`);
            log(matchup, `Error loading beatmap: ${ex}`);
        }
    });

    // Player left event
    mpLobby.on("playerLeft", async (player) => {
        log(matchup, `Player ${player.user.username} left the lobby`);

        if (mapTimerStarted)
            await mpLobby.abortTimer();

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
                    Date.now() - matchStart.getTime() < (matchup.stage!.tournament.abortThreshold || 30) * 1000
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
        await mpLobby.updateSettings();

        if (mapsPlayed.some(m => m.beatmap!.ID === mpLobby.beatmapId))
            return;

        if (!allPlayersInMatchup(matchup, playersInLobby)) {
            await mpChannel.sendMessage("bruh just cuz ur all ready doesnt mean anything if not enough players are in each team to start yet hrur y up");
            return;
        }

        if (!areAllPlayersInAssignedSlots(mpLobby, playersPlaying)) {
            await mpChannel.sendMessage("u are so sneaky!!1!! Now get the same players that were in the map before the abort in here or else .");
            return;
        }

        const slotMod = pools.flatMap(p => p.slots).find(s => s.maps.some(map => map.beatmap!.ID === mpLobby.beatmapId));
        if (!slotMod) {
            await mpChannel.sendMessage("bruh this map isnt in any of the pools??? COINTACT CORSACE IMMEDIATELY");
            return;
        }
        if (!doAllPlayersHaveCorrectMods(mpLobby, slotMod)) {
            await mpChannel.sendMessage(`SOMEEONEEE HAS THE WRONG MODS ON . Allowed mods for this slot are ${getMappoolSlotMods(slotMod.allowedMods).map(m => `${m.longMod} (${m.shortMod})`).join(", ")}`);
            return;
        }

        log(matchup, "All players readied up for the next map");
        await mpLobby.startMatch(5);
        mapTimerStarted = true;
    });

    mpLobby.on("matchAborted", async () => {
        log(matchup, "Match aborted");
        matchStart = undefined;
        mapsPlayed = mapsPlayed.filter(m => m.beatmap!.ID !== mpLobby.beatmapId);

        setTimeout(async () => {
            await mpChannel.sendMessage("Get urselves together and ready up u got 30 seconds");
            await mpLobby.startTimer(30);
            autoStart = true;
        }, leniencyTime);
    });

    mpLobby.on("matchStarted", async () => {
        log(matchup, "Match started");
        mapTimerStarted = false;
        matchStart = new Date();
        const beatmap = pools.flatMap(pool => pool.slots.flatMap(slot => slot.maps)).find(map => map.beatmap!.ID === mpLobby.beatmapId);
        if (!beatmap) {
            await mpLobby.abortMatch();
            await mpChannel.sendMessage("YO HOLD UP I can't find the map in the pool(s) for some reason GET CORSACE STAFF IMNMEDIATRELY");
            log(matchup, `Couldn't find map ${mpLobby.beatmapId} in the pools`);
            return;
        }
        playersPlaying = playersInLobby;
        mapsPlayed.push(beatmap);
    });

    mpLobby.on("matchFinished", async () => {
        const beatmap = mapsPlayed[mapsPlayed.length - 1];
        const mp = await osuClient.multi.getMatch(mpLobby.id) as Multi;
        const game = mp.games[mp.games.length - 1];
        const scores = game.scores;

        if (scores.length === 0 || (scores.length === 1 && scores[0].count300 + scores[0].count100 + scores[0].count50 + scores[0].countMiss < (beatmap.beatmap!.maxCombo || 0) && Date.now() - matchStart!.getTime() < (matchup.stage!.tournament.abortThreshold || 15) * 1000)) {
            mpLobby.emit("matchAborted");
            return;
        }

        log(matchup, "Match finished");
        playersPlaying = undefined;
        matchStart = undefined;

        const matchupMap = new MatchupMap(matchup, beatmap);
        matchupMap.order = mapsPlayed.length;
        await matchupMap.save();

        matchupMap.scores = await Promise.all(scores.map(async (score) => {
            const user = users.find(u => u.osu.userID === score.userId.toString());
            if (!user) {
                await mpChannel.sendMessage(`YO I CAN'T FIND THE USER IN SLOT ${score.slot} (ID ${score.userId}) IN THE MATCHUP GET CORSACE STAFF IMMEDIATELY`);
                throw new Error("User not found");
            }
            const matchupScore = new MatchupScore(user);
            matchupScore.map = matchupMap;
            matchupScore.score = score.score;
            matchupScore.mods = ((score.enabledMods || game.mods) | 1) ^ 1; // Remove NF from mods (the OR 1 is to ensure NM is 0 after XOR)
            matchupScore.misses = score.countMiss;
            matchupScore.combo = score.maxCombo;
            matchupScore.fail = !score.pass;
            matchupScore.accuracy = (score.count50 + 2 * score.count100 + 6 * score.count300) / Math.max(6 * (score.count50 + score.count100 + score.count300), 1);
            matchupScore.fullCombo = score.perfect || score.maxCombo === beatmap.beatmap!.maxCombo;
            return matchupScore.save();
        }));
        matchup.maps!.push(matchupMap);

        log(matchup, `Matchup map and scores saved with matchupMap ID ${matchupMap.ID}`);

        setTimeout(async () => {
            try {
                log(matchup, "Picking map");
                const end = await loadNextBeatmap(matchup, mpLobby, mpChannel, pools, true);
                if (end) {
                    await mpChannel.sendMessage(`No more maps to play, closing lobby in ${leniencyTime / 1000} seconds`);
                    await pause(leniencyTime);
                    await mpLobby.closeLobby();
                    return;
                }
                log(matchup, `Map picked: ${mpLobby.beatmapId} with mods ${mpLobby.mods.map(m => m.shortMod).join(", ")}`);
                autoStart = true;
            } catch (ex) {
                await mpChannel.sendMessage(`Error loading beatmap: ${ex}`);
                log(matchup, `Error loading beatmap: ${ex}`);
            }
        }, matchup.streamer ? 30 * 1000 : 0);
    });

    mpLobby.channel.on("PART", async (member) => {
        if (member.user.isClient()) {
            // Lobby is closed
            matchup.mp = mpLobby.id;
            await matchup.save();
    
            clearInterval(messageSaver);

            state.runningMatchups--;
            maybeShutdown();
        }
    });
}

export default async function runMatchup (matchup: Matchup, replace = false) {
    runMatchupCheck(matchup, replace);

    let lobbyName = `${matchup.stage!.tournament.abbreviation}: (${matchup.team1?.name} vs ${matchup.team2?.name})`;
    if (matchup.stage!.stageType === StageType.Qualifiers)
        lobbyName = `${matchup.stage!.tournament.abbreviation}: ${convertDateToDDDHH(matchup.date)} Qualifiers`;

    log(matchup, `Creating lobby with name ${lobbyName}`);
    const mpChannel = await banchoClient.createLobby(lobbyName, false);
    const mpLobby = mpChannel.lobby;
    log(matchup, `Created lobby with name ${lobbyName} and ID ${mpLobby.id}`);

    matchup.messages = [];
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
        mpLobby.addRef([`#${matchup.stage!.tournament.organizer.osu.userID}`, `#${matchup.referee?.osu.userID || ""}`, `#${matchup.streamer?.osu.userID || ""}`]),
    ]);
    log(matchup, `Set lobby settings, password and added refs`);

    log(matchup, `Inviting players`);
    await invitePlayersToLobby(matchup, mpLobby);
    log(matchup, `Invited players`);

    await runMatchupListeners(matchup, mpLobby, mpChannel);
}