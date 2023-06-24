import { randomUUID } from "crypto";
import { ScoringMethod } from "../../Models/tournaments/stage";
import { Matchup } from "../../Models/tournaments/matchup";
import { StageType } from "../../Models/tournaments/stage";
import { banchoClient, osuClient } from "../../Server/osu";
import { BanchoChannel, BanchoLobby, BanchoLobbyPlayer, BanchoLobbyTeamModes, BanchoLobbyWinConditions, BanchoMods } from "bancho.js";
import { convertDateToDDDHH } from "../../Server/utils/dateParse";
import { MappoolMap } from "../../Models/tournaments/mappools/mappoolMap";
import { MatchupMap } from "../../Models/tournaments/matchupMap";
import { MatchupScore } from "../../Models/tournaments/matchupScore";
import { Multi } from "nodesu";

const winConditions = {
    [ScoringMethod.ScoreV2]: BanchoLobbyWinConditions.ScoreV2,
    [ScoringMethod.ScoreV1]: BanchoLobbyWinConditions.Score,
    [ScoringMethod.Accuracy]: BanchoLobbyWinConditions.Accuracy,
    [ScoringMethod.Combo]: BanchoLobbyWinConditions.Combo,
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

export default async function runMatch (matchup: Matchup, replace = false) {
    runMatchCheck(matchup, replace);

    let lobbyName = `${matchup.stage!.tournament.abbreviation}: (${matchup.team1?.name} vs ${matchup.team2?.name})`;
    if (matchup.stage!.stageType === StageType.Qualifiers)
        lobbyName = `${matchup.stage!.tournament.abbreviation}: ${convertDateToDDDHH(matchup.date)} Qualifiers`;

    const mpChannel = await banchoClient.createLobby(lobbyName, false);
    const mpLobby = mpChannel.lobby;

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

async function runMatchListeners (matchup: Matchup, mpLobby: BanchoLobby, mpChannel: BanchoChannel) {
    const pools = matchup.round?.mappool || matchup.stage!.mappool!;
    let playersInLobby: BanchoLobbyPlayer[] = [];
    let mapsPlayed: MappoolMap[] = [];
    let started = false;

    mpChannel.on("message", async (message) => {
        if (message.self)
            return;

        // TODO: Command checking
    });

    // Player joined event
    mpLobby.on("playerJoined", async (joinInfo) => {
        const newPlayer = joinInfo.player;
        const newPlayerID = newPlayer.user.id.toString();
        if (
            (
                matchup.stage!.stageType === StageType.Qualifiers && 
                !matchup.teams!.some(team => 
                    team.manager.osu.userID === newPlayerID || 
                    team.members.some(player => player.osu.userID === newPlayerID)
                )
            ) ||
            (
                matchup.team1!.manager.osu.userID !== newPlayerID && 
                !matchup.team1!.members.some(player => player.osu.userID === newPlayerID) && 
                matchup.team2!.manager.osu.userID !== newPlayerID && 
                !matchup.team2!.members.some(player => player.osu.userID === newPlayerID)
            )
        ) {
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
            await mpChannel.sendMessage(`Yo ${newPlayer.user.username} we're just waiting for all the managers to be in here and then we'll start the match`);
            return;
        }

        started = true;
        await mpChannel.sendMessage("OK WE;'RE STARTING THE MATCH let's go");

        if (matchup.stage!.stageType === StageType.Qualifiers) {
            const pool = pools[0];

            if (matchup.stage!.qualifierTeamChooseOrder) {
                await mpChannel.sendMessage(`${matchup.teams![0].manager.osu.username} choose the first map . u can put the map id (not set) or the slot name doesnt matter just do 1`);
                await mpLobby.startTimer(matchup.stage!.tournament.mapTimer || 90);
            } else {
                await Promise.all([
                    mpLobby.setMap(pool.slots[0].maps[0].beatmap!.ID),
                    mpLobby.setMods(BanchoMods.parseBitFlags(pool.slots[0].allowedMods || 1).concat(BanchoMods.NoFail), !pool.slots[0].allowedMods || pool.slots[0].userModCount !== undefined || pool.slots[0].uniqueModCount !== undefined),
                ]);

                await Promise.all([
                    mpChannel.sendMessage(`Ok hurry and ready up .`),
                    mpLobby.startTimer(matchup.stage!.tournament.readyTimer || 90),
                ]);
            }
        } else {
            // TODO: implement this
        }
    });

    // Player left event
    mpLobby.on("playerLeft", async (player) => {
        if (
            mpLobby.playing &&
            playersInLobby.some(p => p.user.id === player.user.id)
        )
            await Promise.all([
                mpLobby.abortMatch(),
                mpChannel.sendMessage(`${player.user.username} left the match so we're aborting`),
            ]);

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
        await Promise.all(scores.map(async (score) => {
            const user = users.find(u => u.osu.userID === score.userId.toString());
            if (!user) {
                await mpChannel.sendMessage(`YO I CAN'T FIND THE USER IN SLOT ${score.slot} (ID ${score.userId}) IN THE MATCHUP GET CORSACE STAFF IMMEDIATELY`);
                return;
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
    });
}