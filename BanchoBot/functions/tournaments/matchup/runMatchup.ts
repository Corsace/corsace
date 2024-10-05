import { randomUUID } from "crypto";
import { banchoClient, baseURL, maybeShutdown } from "../../..";
import state from "../../../state";
import { leniencyTime } from "../../../../Models/tournaments/stage";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { StageType, ScoringMethod, MapOrderTeam } from "../../../../Interfaces/stage";
import { osuClient } from "../../../../Server/osu";
import { BanchoChannel, BanchoLobby, BanchoLobbyPlayer, BanchoLobbyTeamModes, BanchoLobbyWinConditions, BanchoUser } from "bancho.js";
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
import kickExtraPlayers from "./kickExtraPlayers";
import loadNextBeatmap from "./loadNextBeatmap";
import log from "./log";
import { MatchupMessage } from "../../../../Models/tournaments/matchupMessage";
import { TournamentChannel } from "../../../../Models/tournaments/tournamentChannel";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMemberRoleManager, InteractionCollector, MessageComponentInteraction, TextChannel } from "discord.js";
import { discordClient } from "../../../../Server/discord";
import { User } from "../../../../Models/user";
import { loginRow } from "../../../../DiscordBot/functions/loginResponse";
import { TournamentRole } from "../../../../Models/tournaments/tournamentRole";
import { unallowedToPlay } from "../../../../Interfaces/tournament";
import { publishSettings } from "./centrifugo";
import assignTeamsToNextMatchup from "../../../../Server/functions/tournaments/matchups/assignTeamsToNextMatchup";
import { MatchupSet } from "../../../../Models/tournaments/matchupSet";
import { MapStatus } from "../../../../Interfaces/matchup";
import { sleep } from "../../../../Server/utils/sleep";
import { publish } from "../../../../Server/functions/centrifugo";

const winConditions = {
    [ScoringMethod.ScoreV2]: BanchoLobbyWinConditions.ScoreV2,
    [ScoringMethod.ScoreV1]: BanchoLobbyWinConditions.Score,
    [ScoringMethod.Accuracy]: BanchoLobbyWinConditions.Accuracy,
    [ScoringMethod.Combo]: BanchoLobbyWinConditions.Combo,
};

function runMatchupCheck (matchup: Matchup, replace: boolean) {
    if (!matchup.stage)
        throw new Error("Matchup has no stage");
    if (
        (!matchup.teams && matchup.stage.stageType === StageType.Qualifiers) ||
        (!matchup.team1 || !matchup.team2) && matchup.stage.stageType !== StageType.Qualifiers
    )
        throw new Error("Matchup has missing teams");
    if (matchup.winner)
        throw new Error("Matchup already has a winner");
    if (matchup.mp && !replace)
        throw new Error("Matchup is already assigned to an mp ID");
    if (!matchup.round?.mappool && !matchup.stage.mappool)
        throw new Error("Matchup is missing mappool");
    if (matchup.stage.stageType !== StageType.Qualifiers && (!matchup.round?.mapOrder?.length && !matchup.stage.mapOrder?.length))
        throw new Error("Matchup is missing map order");
}

async function runMatchupListeners (matchup: Matchup, mpLobby: BanchoLobby, mpChannel: BanchoChannel, invCollector?: InteractionCollector<any>, refCollector?: InteractionCollector<any>, auto = false) {
    const centrifugoChannel = `matchup:${matchup.ID}`;
    // Save and store match instance
    state.runningMatchups++;
    state.matchups[matchup.ID] = {
        matchup,
        lobby: mpLobby,
        autoRunning: auto,
    };
    matchup.mp = mpLobby.id;
    matchup.baseURL = baseURL;
    matchup.winner = null;
    matchup.team1Score = 0;
    matchup.team2Score = 0;
    matchup.forfeit = false;
    await Promise.all(matchup.messages?.map(message => message.remove()) ?? []);
    matchup.messages = [];
    await Promise.all(matchup.sets?.flatMap(set => set.maps?.flatMap(map => map.scores?.map(score => score.remove()) ?? []) ?? []) ?? []);
    await Promise.all(matchup.sets?.flatMap(set => set.maps?.map(map => map.remove()) ?? []) ?? []);
    await Promise.all(matchup.sets?.map(set => set.remove()) ?? []);
    const firstSet = new MatchupSet();
    firstSet.order = 1;
    firstSet.matchup = matchup;
    firstSet.maps = [];
    firstSet.team1Score = 0;
    firstSet.team2Score = 0;
    await firstSet.save();
    matchup.sets = [firstSet];
    await matchup.save();
    log(matchup, `Saved matchup lobby to DB with mp ID ${mpLobby.id}`);

    publish(centrifugoChannel, {
        type: "created",
        mpID: mpLobby.id,
        baseURL,
        firstSet: {
            ID: firstSet.ID,
            order: firstSet.order,
            maps: [],
            team1Score: firstSet.team1Score,
            team2Score: firstSet.team2Score,
        },
    });

    let autoStart = false;
    let mapsPlayed: MappoolMap[] = [];
    let mapTimerStarted = false;
    let matchStart: Date | undefined = undefined;
    let playersInLobby: BanchoLobbyPlayer[] = [];
    let playersPlaying: BanchoLobbyPlayer[] | undefined = undefined;
    let rolling = false;
    let whoRolls: "captains" | "all" | "bot" | null = null;
    let team1Roll = -1;
    let team2Roll = -1;
    let earlyStart = false;
    let started = false;
    let lastMessageSaved = Date.now();
    const aborts = new Map<number, number>();
    const pools = matchup.round?.mappool ?? matchup.stage!.mappool!;

    // Map order stuff, everything should be null/undefined for qualifiers
    const mapOrder = matchup.round?.mapOrder ?? matchup.stage!.mapOrder;
    const setOrder = mapOrder?.map(order => order.set)
        .filter((set, index, self) => self.indexOf(set) === index)
        .map(set => ({ set, maps: mapOrder?.filter(map => map.set === set) })) ?? [];
    const abortText = `(${typeof matchup.stage!.tournament.teamAbortLimit === "number" ? matchup.teams && matchup.teams.length === 1 ? matchup.stage!.tournament.teamAbortLimit - (aborts.get(matchup.teams[0].ID) ?? 0) : matchup.stage!.tournament.teamAbortLimit : "unlimited"} abort(s) allowed per team, and must be within ${matchup.stage!.tournament.abortThreshold ?? 30} seconds after map start)`;
    let picking: string | null = null;
    let banning: string | null = null;
    let protecting: string | null = null;
    let orderString = "";
    let firstTo: number | null = null;

    if (matchup.stage!.stageType !== StageType.Qualifiers) {
        picking = setOrder[0]?.maps.filter(map => map.status === MapStatus.Picked)[0] ? setOrder[0]?.maps.filter(map => map.status === MapStatus.Picked)[0].team === MapOrderTeam.Team1 ? "picking first" : "picking second" : null;
        banning = setOrder[0]?.maps.filter(map => map.status === MapStatus.Banned)[0] ? setOrder[0]?.maps.filter(map => map.status === MapStatus.Banned)[0].team === MapOrderTeam.Team1 ? "banning first" : "banning second" : null;
        protecting = setOrder[0]?.maps.filter(map => map.status === MapStatus.Protected)[0] ? setOrder[0]?.maps.filter(map => map.status === MapStatus.Protected)[0].team === MapOrderTeam.Team1 ? "protecting first" : "protecting second" : null;
        orderString = [ protecting, banning, picking ].filter(o => o !== null).join(", ");
        firstTo = setOrder[0]?.maps.filter(map => map.status === MapStatus.Picked).length / 2 + 1;
    }

    const users = await allAllowedUsersForMatchup(matchup);

    // Periodically save messages every 15 seconds
    const saveMessages = async () => {
        try {
            const messagesToSave = matchup.messages!.filter((message) => message.timestamp.getTime() > lastMessageSaved);
            if (messagesToSave.length > 0) {
                await MatchupMessage
                    .createQueryBuilder()
                    .insert()
                    .values(messagesToSave)
                    .execute();

                lastMessageSaved = messagesToSave[messagesToSave.length - 1].timestamp.getTime();
            }
        } catch(err) {
            log(matchup, `Error saving messages: ${err}`);
        }
    };
    const saveMessagesInterval = setInterval(saveMessages, 15 * 1000);

    // Close lobby 15 minutes after matchup time if not all captains had joined
    setTimeout(async () => {
        if (started || !state.matchups[matchup.ID]?.autoRunning)
            return;

        await mpChannel.sendMessage("matchup lobby closed due to captains not joining");
        await mpLobby.closeLobby();
    }, matchup.date.getTime() - Date.now() + 15 * 60 * 1000);

    // Functionality to abort the map
    const abortMap = async (player: BanchoLobbyPlayer | BanchoUser) => {
        const id = player instanceof BanchoLobbyPlayer ? player.user.id.toString() : player.id.toString();
        const username = player instanceof BanchoLobbyPlayer ? player.user.username : player.username;
        const team = matchup.teams!.find(t => t.members.some(m => m.osu.userID === id));
        if (
            (team &&
                (
                    aborts.get(team.ID) === undefined ||
                    typeof matchup.stage!.tournament.teamAbortLimit !== "number" ||
                    aborts.get(team.ID)! < matchup.stage!.tournament.teamAbortLimit
                )
            ) && (
                matchStart &&
                Date.now() - matchStart.getTime() < (matchup.stage!.tournament.abortThreshold ?? 30) * 1000
            )
        ) {
            const abortCount = (aborts.get(team.ID) ?? 0) + 1;
            await mpLobby.abortMatch();
            await mpChannel.sendMessage(`${username} has triggered an abort${typeof matchup.stage!.tournament.teamAbortLimit === "number" ? `, they now have ${matchup.stage!.tournament.teamAbortLimit - abortCount} aborts left` : ""}`);
            await mpChannel.sendMessage(`reminder: !panic exists if something is going absurdly wrong`);
            aborts.set(team.ID, abortCount);
        } else if (
            team &&
            typeof matchup.stage!.tournament.teamAbortLimit === "number" &&
            aborts.get(team.ID) &&
            aborts.get(team.ID)! >= matchup.stage!.tournament.teamAbortLimit
        ) {
            await mpChannel.sendMessage(`${username} has triggered an abort but the team has reached their abort limit`);
            await mpChannel.sendMessage(`reminder: !panic exists if something is going absurdly wrong`);
        }
    };

    // Functionality to panic
    const panic = async (reason?: string) => {
        state.matchups[matchup.ID].autoRunning = false;

        if (!refCollector?.channelId) {
            await mpChannel.sendMessage(`no ref channel ID found, auto-lobby is stopped. Get the organizers/referees of the tournament to continue the match manually`);
            return;
        }
        const discordChannel = discordClient.channels.cache.get(refCollector.channelId);
        if (!(discordChannel instanceof TextChannel)) {
            await mpChannel.sendMessage(`no ref discord channel found, auto-lobby is stopped. Get the organizers/referees of the tournament to continue the match manually`);
            return;
        }

        const refereeRole = await TournamentRole
            .createQueryBuilder("role")
            .innerJoinAndSelect("role.tournament", "tournament")
            .where("tournament.ID = :tournament", { tournament: matchup.stage!.tournament.ID })
            .andWhere("role.roleType = '6'")
            .getOne();

        await discordChannel.send(`<@${matchup.stage!.tournament.organizer.discord.userID}> ${refereeRole ? `<@&${refereeRole.roleID}>` : ""} ${matchup.referee ? `<@${matchup.referee.discord.userID}>` : ""} ${matchup.streamer ? `<@${matchup.streamer.discord.userID}>` : ""}\n\`PANIC\` has been triggered for mp lobby \`#mp_${mpLobby.id}\` lobby name \`${mpLobby.name}\`\nReason: \`${reason ?? "UNKNOWN"}\`\n\nAuto-running lobby has stopped\n\nLatest 10 messages:\n\`\`\`${matchup.messages!.slice(-10).map(message => `${message.timestamp.toLocaleString("en-US", { timeZone: "UTC" })} | ${message.user.osu.username}: ${message.content}`).join("\n")}\`\`\``);
        await mpChannel.sendMessage(`stopped auto-lobby, refs and organizers of the tourney are notified`);
    };

    mpChannel.on("message", async (message) => {
        if (!state.matchups[matchup.ID])
            return;

        log(matchup, `${message.user.ircUsername} says: ${message.content}`);

        const user = await getUserInMatchup(users, message);
        const matchupMessage = new MatchupMessage();
        matchupMessage.timestamp = new Date();
        matchupMessage.content = message.content;
        matchupMessage.matchup = matchup;
        matchupMessage.user = user;
        matchup.messages!.push(matchupMessage);

        publish(centrifugoChannel, {
            type: "message",
            timestamp: matchupMessage.timestamp,
            content: matchupMessage.content,
            user: {
                ID: matchupMessage.user.ID,
                osu: {
                    userID: matchupMessage.user.osu.userID,
                    username: matchupMessage.user.osu.username,
                },
            },
        });

        // Rolling logic
        if (message.self) {
            if (message.content.startsWith("OK we're gonna roll now"))
                rolling = true;

            if (message.content.includes("I want the captains to do !roll"))
                whoRolls = "captains";
            else if (message.content.includes("I want the stand-in captains to do !roll"))
                whoRolls = "all";
            else
                whoRolls = "bot";
        } else if (message.user.ircUsername === "BanchoBot" && rolling && /(.+) rolls (\d+) point\(s\)/.test(message.content)) {
            // BanchoBot sent a message that says "x rolls y point(s)"
            const username = message.content.split(" ")[0];
            const points = parseInt(message.content.split(" ")[2]);
            if (isNaN(points))
                return;

            if (whoRolls === "bot" && username === "Corsace") {
                if (points !== 1 && points !== 2)
                    return;

                if (points === 1)
                    matchup.sets![matchup.sets!.length - 1].first = matchup.team1;
                else if (points === 2)
                matchup.sets![matchup.sets!.length - 1].first = matchup.team2;
                await matchup.save();
                rolling = false;

                await mpChannel.sendMessage(`${matchup.sets![matchup.sets!.length - 1].first?.name} is considered team 1 so they'll be ${orderString}`);
            } else {
                const player = playersInLobby.find(p => p.user.username === username);
                if (!player)
                    return;

                if (whoRolls === "captains") {
                    if (matchup.team1!.captain.osu.userID === player.user.id.toString()) {
                        if (team1Roll !== -1) {
                            await mpChannel.sendMessage(`${username} U already rolled ${team1Roll} point(s) u cant roll again`);
                            return;
                        }
                        team1Roll = points;
                    } else if (matchup.team2!.captain.osu.userID === player.user.id.toString()) {
                        if (team2Roll !== -1) {
                            await mpChannel.sendMessage(`${username} U already rolled ${team2Roll} point(s) u cant roll again`);
                            return;
                        }
                        team2Roll = points;
                    } else
                        return;
                } else if (whoRolls === "all") {
                    if (matchup.team1!.captain.osu.userID === player.user.id.toString() || matchup.team1!.members.some(m => m.osu.userID === player.user.id.toString())) {
                        if (team1Roll !== -1) {
                            await mpChannel.sendMessage(`${username} Ur team already rolled ${team1Roll} point(s) u cant roll again`);
                            return;
                        }
                        team1Roll = points;
                    } else if (matchup.team2!.captain.osu.userID === player.user.id.toString() || matchup.team2!.members.some(m => m.osu.userID === player.user.id.toString())) {
                        if (team2Roll !== -1) {
                            await mpChannel.sendMessage(`${username} Ur team already rolled ${team2Roll} point(s) u cant roll again`);
                            return;
                        }
                        team2Roll = points;
                    } else
                        return;
                }

                if (team1Roll === team2Roll) {
                    await mpChannel.sendMessage("both teams rolled the same number of points, roll again");
                    team1Roll = -1;
                    team2Roll = -1;
                    return;
                }

                if (team1Roll === -1 || team2Roll === -1)
                    return;

                if (team1Roll > team2Roll)
                    matchup.sets![matchup.sets!.length - 1].first = matchup.team1;
                else if (team2Roll > team1Roll)
                    matchup.sets![matchup.sets!.length - 1].first = matchup.team2;
                await matchup.save();
                rolling = false;

                await mpChannel.sendMessage(`${matchup.sets![matchup.sets!.length - 1].first?.name} is considered team 1 so theyll be ${orderString}`);
            }

            publish(centrifugoChannel, {
                type: "first",
                first: matchup.sets![matchup.sets!.length - 1].first?.ID,
            });
        }

        if (message.self || !state.matchups[matchup.ID].autoRunning)
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
                await mpChannel.sendMessage("timer ran out, starting the match now (and kicking any extra players)");
                setTimeout(async () => {
                    if (!autoStart)
                        return;
                    await kickExtraPlayers(matchup, playersInLobby, mpLobby);
                    await mpChannel.sendMessage(`reminder: !abort will stop the map, and !panic will notify the organizer and stop the auto-lobby ${abortText}`);
                    await mpLobby.startMatch(5);
                    mapTimerStarted = true;
                    autoStart = false;
                }, leniencyTime);
            }

            return;
        }

        if (
            (
                message.message === "!abort" ||
                message.message === "!stop" ||
                message.message === "!mp abort" ||
                message.message === "!mp stop"
            ) &&
            mpLobby.playing &&
            playersInLobby.some(p => p.user.id === message.user.id)
        )
            await abortMap(message.user);
        else if (
            (
                message.message === "!panic" ||
                message.message === "!alert" ||
                message.message === "!mp panic" ||
                message.message === "!mp alert"
            ) &&
            state.matchups[matchup.ID].autoRunning
        ) {
            await panic(`${message.user.username} ran !panic`);
        } else if (
            (
                message.message === "!start" ||
                message.message === "!mp start"
            ) &&
            (
                !started &&
                (
                    message.user.id === undefined ||
                    message.user.id === 29191632 ||
                    !users.some(u => u.osu.userID === message.user.id.toString()) ||
                    earlyStart
                )
            )
        ) {
            earlyStart = true;
            started = true;
            await mpChannel.sendMessage("matchup's now starting (captains dont need to stay in lobby)");

            await sleep(leniencyTime);
            try {
                log(matchup, "Picking map");
                await loadNextBeatmap(matchup, mpLobby, mpChannel, pools, false);
                log(matchup, `Map picked: ${mpLobby.beatmapId} with mods ${mpLobby.mods?.map(mod => mod.shortMod).join(", ") || "freemod"}`);
                autoStart = true;
            } catch (ex) {
                await mpChannel.sendMessage(`Error loading beatmap: ${ex}`);
                log(matchup, `Error loading beatmap: ${ex}`);
                console.log(ex);
            }
        } else if (
            (
                message.message === "!auto" ||
                message.message === "!mp auto"
            ) &&
            (
                message.user.id === undefined ||
                message.user.id === 29191632 ||
                !users.some(u => u.osu.userID === message.user.id.toString())
            ) &&
            !state.matchups[matchup.ID].autoRunning
        ) {
            state.matchups[matchup.ID].autoRunning = true;
            await mpChannel.sendMessage("auto-lobby has resumed");
            log(matchup, "Auto-lobby started again");
        }
    });

    // Beatmap change event
    mpLobby.on("beatmapId", (beatmapID) => publish(centrifugoChannel, { type: "beatmap", beatmapID }));

    // Player joined event
    mpLobby.on("playerJoined", async (joinInfo) => {
        if (!state.matchups[matchup.ID])
            return;

        const newPlayer = joinInfo.player;
        const newPlayerID = newPlayer.user.id.toString();
        if (!isPlayerInMatchup(matchup, newPlayerID, true)) {
            await Promise.all([
                mpLobby.banPlayer(newPlayer.user.ircUsername),
                mpLobby.setPassword(randomUUID()),
                (await banchoClient.getUserById(newPlayer.user.id)).sendMessage("Bruh u aint part of this matchup"),
            ]);
            await invitePlayersToLobby(matchup, mpLobby),
            await mpChannel.sendMessage(`${newPlayer.user.ircUsername} joined when they shouldnt have, changed password and resent invites`);
            return;
        }

        playersInLobby.push(newPlayer);
        log(matchup, `Player ${newPlayer.user.username} joined the lobby`);

        publishSettings(matchup, mpLobby.slots);

        if (started || mpLobby.playing || !state.matchups[matchup.ID].autoRunning)
            return;

        if (
            (
                matchup.stage!.stageType === StageType.Qualifiers &&
                matchup.teams!.some(team => !mpLobby.slots.some(m => m?.user.id.toString() === team.captain.osu.userID))
            ) ||
            (
                matchup.stage!.stageType !== StageType.Qualifiers &&
                !mpLobby.slots.some(m => m?.user.id.toString() === matchup.team1!.captain.osu.userID) &&
                !mpLobby.slots.some(m => m?.user.id.toString() === matchup.team2!.captain.osu.userID)
            )
        ) {
            await mpChannel.sendMessage(`${newPlayer.user.username} waiting for all ${matchup.stage!.tournament.matchupSize === 1 ? "players" : "captains"} to be here before matchup starts`);
            return;
        }

        if (earlyStart)
            return;

        earlyStart = true;
        if (matchup.date.getTime() > Date.now()) {
            await mpChannel.sendMessage("all captains now exist");
            await mpChannel.sendMessage("to get the first map up earlier, have a captain type \"!start\"");
            await mpChannel.sendMessage(`otherwise, the matchup is scheduled to start at ${matchup.date.toLocaleString("en-US", { timeZone: "UTC" })}`);
            await sleep(matchup.date.getTime() - Date.now());
            if (started)
                return;
        }

        started = true;
        await mpChannel.sendMessage(`matchup has started (only ${matchup.stage!.tournament.matchupSize} players per map)`);
        await mpChannel.sendMessage("captains don't need to stay if they're not playing");

        await sleep(leniencyTime);
        try {
            log(matchup, "Picking map");
            await loadNextBeatmap(matchup, mpLobby, mpChannel, pools, false);
            log(matchup, `Map picked: ${mpLobby.beatmapId} with mods ${mpLobby.mods?.map(mod => mod.shortMod).join(", ") || "freemod"}`);
            autoStart = true;
        } catch (ex) {
            await mpChannel.sendMessage(`Error loading beatmap: ${ex}`);
            log(matchup, `Error loading beatmap: ${ex}`);
            console.log(ex);
        }
    });

    // Player left event
    mpLobby.on("playerLeft", async (player) => {
        if (!state.matchups[matchup.ID])
            return;

        log(matchup, `Player ${player.user.username} left the lobby`);

        publishSettings(matchup, mpLobby.slots);

        if (!state.matchups[matchup.ID].autoRunning)
            return;

        if (mapTimerStarted)
            await mpLobby.abortTimer();

        if (
            mpLobby.playing &&
            playersPlaying?.some(p => p.user.id === player.user.id)
        )
            await abortMap(player);

        playersInLobby = playersInLobby.filter(p => p.user.id !== player.user.id);
    });

    // Player changed team event
    mpLobby.on("playerChangedTeam", () => publishSettings(matchup, mpLobby.slots));

    // Player moved event
    mpLobby.on("playerMoved", () => publishSettings(matchup, mpLobby.slots));

    // Mods event
    mpLobby.on("mods", () => publishSettings(matchup, mpLobby.slots));

    // Freemod event
    mpLobby.on("freemod", () => publishSettings(matchup, mpLobby.slots));

    // All players ready event
    mpLobby.on("allPlayersReady", async () => {
        if (!state.matchups[matchup.ID])
            return;

        await mpLobby.updateSettings();

        publishSettings(matchup, mpLobby.slots);

        if (mapsPlayed.some(m => m.beatmap!.ID === mpLobby.beatmapId) || !state.matchups[matchup.ID].autoRunning)
            return;

        if (!allPlayersInMatchup(matchup, playersInLobby)) {
            await mpChannel.sendMessage("not enough players ready in each team to start yet");
            return;
        }

        if (!areAllPlayersInAssignedSlots(mpLobby, playersPlaying)) {
            await mpChannel.sendMessage("get the same players that were in the map before the abort in here");
            return;
        }

        const slotMod = pools.flatMap(p => p.slots).find(s => s.maps.some(map => map.beatmap!.ID === mpLobby.beatmapId));
        if (!slotMod) {
            await mpChannel.sendMessage("this map isnt in any of the pools, contact Corsace IMMEDIATELY");
            return;
        }
        if (!doAllPlayersHaveCorrectMods(mpLobby, slotMod)) {
            await mpChannel.sendMessage(`Someone has the wrong mods on for this slot, or is missing NoFail (NF). Allowed mods (alongside requiring NF) are ${typeof slotMod.allowedMods === "number" && slotMod.allowedMods > 1 ? getMappoolSlotMods(slotMod.allowedMods & (~1)).map(m => `${m.longMod} (${m.shortMod.toUpperCase()})`).join(", ") : "any desired mods"}`);
            return;
        }

        log(matchup, "All players readied up for the next map");
        await mpChannel.sendMessage(`as a reminder, !abort will stop the map, and !panic will notify the organizer and stop the auto-lobby ${abortText}`);
        await mpLobby.startMatch(5);
        mapTimerStarted = true;
    });

    mpLobby.on("matchAborted", () => {
        if (!state.matchups[matchup.ID])
            return;

        log(matchup, "Match aborted");

        matchStart = undefined;
        mapsPlayed = mapsPlayed.filter(m => m.beatmap!.ID !== mpLobby.beatmapId);

        publish(centrifugoChannel, { type: "matchAborted" });

        if (!state.matchups[matchup.ID].autoRunning)
            return;

        setTimeout(async () => {
            await mpChannel.sendMessage("match aborted, 30 seconds to ready up again");
            await mpLobby.startTimer(30);
            autoStart = true;
        }, leniencyTime);
    });

    mpLobby.on("matchStarted", async () => {
        if (!state.matchups[matchup.ID])
            return;

        log(matchup, "Match started");

        mapTimerStarted = false;
        matchStart = new Date();
        const beatmap = pools.flatMap(pool => pool.slots.flatMap(slot => slot.maps)).find(map => map.beatmap!.ID === mpLobby.beatmapId);
        if (!beatmap) {
            if (state.matchups[matchup.ID].autoRunning) {
                await mpLobby.abortMatch();
                await panic(`Couldn't find beatmap ID ${mpLobby.beatmapId} in the pools`);
                log(matchup, `Couldn't find beatmap ${mpLobby.beatmapId} in the pools, panicking`);
                return;
            } else {
                await mpChannel.sendMessage("cant find the map in the pool(s) but not aborting since auto-lobby is off. Crashing is possible. Contact Corsace IMMEDIATELY");
            }
        } else
            mapsPlayed.push(beatmap);

        // Panic if lobby is empty
        if (playersInLobby.length === 0) {
            await mpLobby.abortMatch();
            await panic("Map started with no players in the lobby");
            log(matchup, `Lobby is empty, panicking`);
            return;
        }

        playersPlaying = playersInLobby;

        publish(centrifugoChannel, { type: "matchStarted" });
    });

    mpLobby.on("matchFinished", async () => {
        if (!state.matchups[matchup.ID])
            return;

        const beatmap = mapsPlayed[mapsPlayed.length - 1];
        const mp = await osuClient.multi.getMatch(mpLobby.id) as Multi;
        const game = mp.games[mp.games.length - 1];
        const scores = game.scores;

        if (scores.length === 0 || (scores.length === 1 && scores[0].count300 + scores[0].count100 + scores[0].count50 + scores[0].countMiss < (beatmap.beatmap!.maxCombo ?? 0) && Date.now() - matchStart!.getTime() < (matchup.stage!.tournament.abortThreshold ?? 15) * 1000)) {
            mpLobby.emit("matchAborted");
            return;
        }

        log(matchup, "Match finished");
        playersPlaying = undefined;
        matchStart = undefined;

        const matchupMap = new MatchupMap();
        matchupMap.set = matchup.sets![matchup.sets!.length - 1];
        matchupMap.map = beatmap;
        matchupMap.order = matchup.sets![matchup.sets!.length - 1].maps!.length + 1;
        await matchupMap.save();
        matchup.sets![matchup.sets!.length - 1].maps!.push(matchupMap);

        matchupMap.scores = await Promise.all(scores.map(async (score) => {
            const user = users.find(u => u.osu.userID === score.userId.toString());
            if (!user) {
                await mpChannel.sendMessage(`cant find the user in slot ${score.slot} (ID ${score.userId}) in the matchup contact Corsace IMMEDIATELY"`);
                throw new Error("User not found");
            }
            const matchupScore = new MatchupScore();
            matchupScore.user = user;
            matchupScore.map = matchupMap;
            matchupScore.score = score.score;
            matchupScore.mods = ((score.enabledMods ?? game.mods) | 1) ^ 1; // Remove NF from mods (the OR 1 is to ensure NM is 0 after XOR)
            matchupScore.misses = score.countMiss;
            matchupScore.combo = score.maxCombo;
            matchupScore.fail = !score.pass;
            matchupScore.accuracy = (score.count50 + 2 * score.count100 + 6 * score.count300) / Math.max(6 * (score.countMiss + score.count50 + score.count100 + score.count300), 1);
            matchupScore.fullCombo = score.perfect || score.maxCombo === beatmap.beatmap!.maxCombo;
            return matchupScore.save();
        }));
        if (matchup.stage!.stageType !== StageType.Qualifiers) {
            const team1Score = matchupMap.scores
                .filter(score => matchup.team1!.members.some(m => m.osu.userID === score.user.osu.userID))
                .reduce((acc, score) => acc + score.score, 0);
            const team2Score = matchupMap.scores
                .filter(score => matchup.team2!.members.some(m => m.osu.userID === score.user.osu.userID))
                .reduce((acc, score) => acc + score.score, 0);

            if (team1Score > team2Score) {
                matchup.sets![matchup.sets!.length - 1].team1Score++;
                matchupMap.winner = matchup.team1;
            } else if (team2Score > team1Score) {
                matchup.sets![matchup.sets!.length - 1].team2Score++;
                matchupMap.winner = matchup.team2;
            }

            if (matchup.sets![matchup.sets!.length - 1].team1Score === firstTo) {
                matchup.sets![matchup.sets!.length - 1].winner = matchup.team1;
                matchup.team1Score++;
            } else if (matchup.sets![matchup.sets!.length - 1].team2Score === firstTo) {
                matchup.sets![matchup.sets!.length - 1].winner = matchup.team2;
                matchup.team2Score++;
            }
            await matchup.sets![matchup.sets!.length - 1].save();
        }

        if (matchup.sets![matchup.sets!.length - 1].winner && setOrder.length > matchup.sets!.length) {
            const nextSet = new MatchupSet();
            nextSet.order = matchup.sets![matchup.sets!.length - 1].order + 1;
            nextSet.matchup = matchup;
            nextSet.maps = [];
            matchup.sets!.push(nextSet);

            picking = setOrder[matchup.sets!.length - 1]?.maps.filter(map => map.status === MapStatus.Picked)[0] ? setOrder[matchup.sets!.length - 1]?.maps.filter(map => map.status === MapStatus.Picked)[0].team === MapOrderTeam.Team1 ? "picking first" : "picking second" : null;
            banning = setOrder[matchup.sets!.length - 1]?.maps.filter(map => map.status === MapStatus.Banned)[0] ? setOrder[matchup.sets!.length - 1]?.maps.filter(map => map.status === MapStatus.Banned)[0].team === MapOrderTeam.Team1 ? "banning first" : "banning second" : null;
            protecting = setOrder[matchup.sets!.length - 1]?.maps.filter(map => map.status === MapStatus.Protected)[0] ? setOrder[matchup.sets!.length - 1]?.maps.filter(map => map.status === MapStatus.Protected)[0].team === MapOrderTeam.Team1 ? "protecting first" : "protecting second" : null;
            orderString = [ protecting, banning, picking ].filter(o => o !== null).join(", ");

            firstTo = setOrder[matchup.sets!.length - 1]?.maps.filter(map => map.status === MapStatus.Picked).length / 2 + 1;
        }
        await matchup.save();

        log(matchup, `Matchup map and scores saved with matchupMap ID ${matchupMap.ID}`);

        const mappoolSlot = pools.flatMap(pool => pool.slots).find(slot => slot.maps.some(map => map.ID === beatmap.ID));
        publish(centrifugoChannel, {
            type: "matchFinished",
            setTeam1Score: matchup.sets?.[(matchup.sets?.length || 1) - 1]?.team1Score ?? 0,
            setTeam2Score: matchup.sets?.[(matchup.sets?.length || 1) - 1]?.team2Score ?? 0,
            setWinner: matchup.sets?.[(matchup.sets?.length || 1) - 1]?.winner?.ID,
            team1Score: matchup.team1Score,
            team2Score: matchup.team2Score,
            map: {
                ID: matchupMap.ID,
                map: beatmap,
                order: matchupMap.order,
                status: matchupMap.status,
                scores: matchupMap.scores.map(score => {
                    const team = matchup.team1?.captain.ID === score.user.ID || matchup.team1?.members.find(member => member.ID === score.user.ID)
                        ? matchup.team1
                        : matchup.team2?.captain.ID === score.user.ID || matchup.team2?.members.find(member => member.ID === score.user.ID)
                            ? matchup.team2
                            : undefined;

                    return {
                        teamID: team?.ID ?? 0,
                        teamName: team?.name ?? "",
                        teamAvatar: team?.avatarURL ?? "",
                        username: score.user.osu.username,
                        userID: parseInt(score.user.osu.userID),
                        score: score.score,
                        map: `${mappoolSlot?.acronym}${matchupMap.order}`,
                        mapID: matchupMap.ID,
                    };
                }),
            },
        });

        if (!state.matchups[matchup.ID].autoRunning)
            return;

        setTimeout(async () => {
            try {
                log(matchup, "Picking map");
                const end = await loadNextBeatmap(matchup, mpLobby, mpChannel, pools, true);
                if (end) {
                    await mpChannel.sendMessage(`no more maps to play, closing lobby in ${leniencyTime / 1000} seconds`);
                    await sleep(leniencyTime);
                    if (!state.matchups[matchup.ID].autoRunning)
                        return;
                    await mpLobby.closeLobby();
                    return;
                }
                log(matchup, `Map picked: ${mpLobby.beatmapId} with mods ${mpLobby.mods?.map(m => m.shortMod).join(", ") || "freemod"}`);
                autoStart = true;
            } catch (ex) {
                await mpChannel.sendMessage(`Error loading beatmap: ${ex}`);
                log(matchup, `Error loading beatmap: ${ex}`);
                console.log(ex);
            }
        }, matchup.streamer ? 30 * 1000 : leniencyTime);
    });

    const connectionListener = async () => {
        log(matchup, `Trying to re-join channel ${mpLobby.id}`);
        try {
            await mpChannel.join();
            log(matchup, `Re-joined channel, informing users and triggering panic`);
            mpChannel.sendMessage("Encountered an IRC connection issue, match will resume upon human review.")
                .catch((err) => log(matchup, `Error while notifying users of connection issue: ${err}`));
            panic("Bancho client disconnected")
                .catch((err) => log(matchup, `Error while panicking: ${err}`));
        } catch(err) {
            // Most likely Bancho actually rebooted, so we should terminate the lobby
            log(matchup, `Failed to re-join lobby ${mpLobby.id}, terminating: ${err}`);
            await terminateLobby();
        }
    };
    banchoClient.on("connected", connectionListener);

    mpChannel.on("PART", (member) => {
        if (!member.user.isClient())
            return;

        // In case of a disconnection, bancho.js is firing PART events before updating `connectState`, so we must wait a tick before checking.
        // If we're disconncted, trying to rejoin the channel before terminating.
        process.nextTick(() => {
            if (!banchoClient.isConnected())
                return;
            void terminateLobby();
        });
    });

    async function terminateLobby () {
        // Lobby is closed
        invCollector?.stop();
        refCollector?.stop();
        banchoClient.removeListener("connected", connectionListener);
        clearInterval(saveMessagesInterval);

        try {
            // If forfeit, save from the state because forfeit is assigned from the ref endpoint, not the bot (and the below functionality would remove it otherwise)
            if (state.matchups[matchup.ID] && state.matchups[matchup.ID].matchup.forfeit)
                matchup = state.matchups[matchup.ID].matchup;

            matchup.baseURL = null;
            if (matchup.stage!.stageType !== StageType.Qualifiers) {
                if (!matchup.forfeit && matchup.team1Score > matchup.team2Score)
                    matchup.winner = matchup.team1;
                else if (!matchup.forfeit && matchup.team2Score > matchup.team1Score)
                    matchup.winner = matchup.team2;
                await matchup.save();

                await assignTeamsToNextMatchup(matchup.ID);
            } else
                await matchup.save();
        } catch(err) {
            log(matchup, `Error while terminating lobby: ${err}`);
        } finally {
            await saveMessages();
            publish(centrifugoChannel, { type: "closed" });

            state.runningMatchups--;
            delete state.matchups[matchup.ID];
            await maybeShutdown();
        }
    }
}

export default async function runMatchup (matchup: Matchup, replace = false, auto = false, runBy?: string) {
    runMatchupCheck(matchup, replace);

    let lobbyName = `${matchup.stage!.tournament.abbreviation}: (${matchup.team1?.name}) vs (${matchup.team2?.name})`;
    if (matchup.stage!.stageType === StageType.Qualifiers)
        lobbyName = `${matchup.stage!.tournament.abbreviation}: (${convertDateToDDDHH(matchup.date)} QL) vs (${matchup.teams?.map(team => team.abbreviation).join(", ")})`;

    log(matchup, `Creating lobby with name ${lobbyName}`);
    const mpChannel = await banchoClient.createLobby(lobbyName);
    const mpLobby = mpChannel.lobby;
    log(matchup, `Created lobby with name ${lobbyName} and ID ${mpLobby.id}`);

    // no extra slot for qualifiers
    // slots for each team based on matchup size
    const requiredPlayerAmount = Math.min(16, (matchup.stage!.stageType === StageType.Qualifiers ? 0 : 1) + matchup.stage!.tournament.matchupSize * (matchup.teams?.length ?? 2));

    let scoringMode = BanchoLobbyWinConditions.ScoreV2;
    if (matchup.stage!.scoringMethod in winConditions)
        scoringMode = winConditions[matchup.stage!.scoringMethod as keyof typeof winConditions];

    log(matchup, `Setting lobby settings, password and adding refs`);
    await Promise.all([
        mpLobby.setPassword(randomUUID()),
        mpLobby.setSettings(
            matchup.stage!.stageType === StageType.Qualifiers ? BanchoLobbyTeamModes.HeadToHead : BanchoLobbyTeamModes.TeamVs,
            scoringMode,
            requiredPlayerAmount
        ),
        mpLobby.addRef([`#${matchup.stage!.tournament.organizer.osu.userID}`, `#${matchup.referee?.osu.userID ?? ""}`, `#${matchup.streamer?.osu.userID ?? ""}`]),
    ]);
    log(matchup, `Set lobby settings, password and added refs`);
    const refChannel = await TournamentChannel
        .createQueryBuilder("channel")
        .innerJoinAndSelect("channel.tournament", "tournament")
        .where("tournament.ID = :tournament", { tournament: matchup.stage!.tournament.ID })
        .andWhere("channel.channelType = '9'")
        .getOne();
    let refCollector: InteractionCollector<any> | undefined = undefined;
    if (refChannel) {
        const refID = randomUUID();
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(refID)
                    .setLabel("Re-addref")
                    .setStyle(ButtonStyle.Primary)
            );

        const discordChannel = discordClient.channels.cache.get(refChannel.channelID);
        if (discordChannel instanceof TextChannel) {
            const refMessage = await discordChannel.send({
                content: `Lobby has been created for \`${lobbyName}\` ID and channel \`#mp_${mpLobby.id}\` by \`${auto ? "Corsace" : runBy}\`, if u need to be (re)added as a ref, and u have a role considered unallowed to play, press the button below.${auto ? `\n\n\`!start\` allows u to start the matchup if the team captains aren't able to make it\n\`!auto\` resumes the bot to run the lobby IF a user had used \`!panic\`` : ""}\n\nMake sure u are online on osu! for the addref to work`,
                components: [row],
            });

            // Allow the message to stay up until lobby closes
            const roles = await TournamentRole
                .createQueryBuilder("role")
                .innerJoinAndSelect("role.tournament", "tournament")
                .where("tournament.ID = :tournament", { tournament: matchup.stage!.tournament.ID })
                .getMany();
            const refRoles = roles.filter(role => unallowedToPlay.includes(role.roleType));
            refCollector = refMessage.createMessageComponentCollector();
            refCollector.on("collect", async (i: MessageComponentInteraction) => {
                if (i.customId !== refID)
                    return;
                if (!i.member) {
                    await i.reply({ content: "couldnt receive ur member info", ephemeral: true });
                    return;
                }
                if (
                    (
                        i.member.roles instanceof GuildMemberRoleManager &&
                        !i.member.roles.cache.some(role => refRoles.some(refRole => refRole.roleID === role.id))
                    ) ||
                    (
                        !(i.member.roles instanceof GuildMemberRoleManager) &&
                        !i.member.roles.some(role => refRoles.some(refRole => refRole.roleID === role))
                    )
                ) {
                    await i.reply({ content: "ur not allowed to ref .", ephemeral: true });
                    return;
                }
                const user = await User
                    .createQueryBuilder("user")
                    .where("user.discord.userID = :discord", { discord: i.user.id })
                    .getOne();
                if (!user) {
                    await i.reply({ content: "couldnt find u in the database make sure u are logged in .", ephemeral: true, components: [loginRow] });
                    return;
                }
                await mpLobby.addRef([`#${user.osu.userID}`]);
                await i.reply({ content: "Addreffed", ephemeral: true });
            });
            refCollector.on("end", async () => {
                if (!refMessage.deletable)
                    return;
                await refMessage.delete();
            });
            log(matchup, `Created addref message`);
        }
    }

    log(matchup, `Inviting players`);
    const IDs = await invitePlayersToLobby(matchup, mpLobby);
    log(matchup, `Invited players`);

    const generalChannel = await TournamentChannel
        .createQueryBuilder("channel")
        .innerJoinAndSelect("channel.tournament", "tournament")
        .where("tournament.ID = :tournament", { tournament: matchup.stage!.tournament.ID })
        .andWhere("channel.channelType = '0'")
        .getOne();
    let invCollector: InteractionCollector<any> | undefined = undefined;
    if (generalChannel) {
        const inviteID = randomUUID();
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(inviteID)
                    .setLabel("Resend invite")
                    .setStyle(ButtonStyle.Primary)
            );

        const discordChannel = discordClient.channels.cache.get(generalChannel.channelID);
        if (discordChannel instanceof TextChannel) {
            const invMessage = await discordChannel.send({
                content: `${IDs.map(id => `<@${id.discord}>`).join(" ")}\n\nLobby has been created for ur match by \`${auto ? "Corsace" : runBy}\`, if u need to be reinvited, press the button below.\n\nMake sure u have non-friends DMs allowed on osu!${auto ? `\n\n**IF YOU INCORRECTLY SCHEDULED THIS MATCHUP AND WANTED ANOTHER TIME, PLEASE PING AN ORGANIZER TO RUN \`tournament_qualifier\` WITH YOUR CORRECT DESIRED TIME. THIS WILL CLOSE THE CURRENT LOBBY.**\n\nThe following commands work in lobby:\n\`!panic\` will notify organizers/currently assigned refs if anything goes absurdly wrong and stop auto-running the lobby\n\`!abort\` allows u to abort a map within the allowed time after a map start, and for the allowed amount of times a team is allowed to abort (${typeof matchup.stage!.tournament.teamAbortLimit === "number" ? matchup.stage!.tournament.teamAbortLimit : "unlimited"} aborts per team, and must be within ${typeof matchup.stage!.tournament.abortThreshold === "number" ? matchup.stage!.tournament.abortThreshold : "30"} seconds after map start)\n\`!start\` allows a captain to start the matchup before the match time if the captain appears in the lobby beforehand` : ""}\n\nIf ur not part of the matchup, the button wont work for u .`,
                components: [row],
            });

            // Allow the message to stay up and send invites until the lobby closes
            invCollector = invMessage.createMessageComponentCollector();
            invCollector.on("collect", async (i: MessageComponentInteraction) => {
                if (i.customId !== inviteID)
                    return;
                const osuID = IDs.find(id => id.discord === i.user.id)?.osu;
                if (!osuID) {
                    await i.reply({ content: "What did i tell u .", ephemeral: true });
                    return;
                }
                await mpLobby.invitePlayer(`#${osuID}`);
                await i.reply({ content: "Invite sent", ephemeral: true });
            });
            invCollector.on("end", async () => {
                if (!invMessage.deletable)
                    return;
                await invMessage.delete().catch((err) => log(matchup, `Error while deleting invite message: ${err}`));
            });
            log(matchup, `Created invite message for ${IDs.length} players`);
        }
    }

    await runMatchupListeners(matchup, mpLobby, mpChannel, invCollector, refCollector, auto);
}
