import { randomUUID } from "crypto";
import { banchoClient, baseURL, maybeShutdown } from "../../..";
import state from "../../../state";
import { leniencyTime } from "../../../../Models/tournaments/stage";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { StageType, ScoringMethod } from "../../../../Interfaces/stage";
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
import { MatchupMessage } from "../../../../Models/tournaments/matchupMessage";
import { TournamentChannel } from "../../../../Models/tournaments/tournamentChannel";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMemberRoleManager, InteractionCollector, MessageComponentInteraction, TextChannel } from "discord.js";
import { discordClient } from "../../../../Server/discord";
import { User } from "../../../../Models/user";
import { loginRow } from "../../../../DiscordBot/functions/loginResponse";
import { TournamentRole, unallowedToPlay } from "../../../../Models/tournaments/tournamentRole";

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

async function runMatchupListeners (matchup: Matchup, mpLobby: BanchoLobby, mpChannel: BanchoChannel, invCollector?: InteractionCollector<any>, refCollector?: InteractionCollector<any>) {
    // Save and store match instance
    state.runningMatchups++;
    state.matchups[matchup.ID] = {
        matchup,
        lobby: mpLobby,
        autoRunning: true,
    };
    matchup.mp = mpLobby.id;
    matchup.baseURL = baseURL;
    await matchup.save();
    log(matchup, `Saved matchup lobby to DB with ID ${mpLobby.id}`);

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
        if (messagesToSave.length > 0) {
            await MatchupMessage
                .createQueryBuilder()
                .insert()
                .values(messagesToSave)
                .execute();

            lastMessageSaved = messagesToSave[messagesToSave.length - 1].timestamp.getTime();
        }
    }, 15 * 1000);

    // Close lobby 15 minutes after matchup time if not all managers had joined
    setTimeout(async () => {
        if (started || !state.matchups[matchup.ID].autoRunning)
            return;

        await mpChannel.sendMessage("Matchup lobby closed due to managers not joining");
        await mpLobby.closeLobby();
    }, matchup.date.getTime() - Date.now() + 15 * 60 * 1000);

    // Functionality to abort the map
    const abortMap = async (player: BanchoLobbyPlayer | BanchoUser) => {
        const id = player instanceof BanchoLobbyPlayer ? player.user.id.toString() : player.id.toString();
        const username = player instanceof BanchoLobbyPlayer ? player.user.username : player.username;
        const team = matchup.teams!.find(team => team.members.some(m => m.osu.userID === id));
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
            const abortCount = (aborts.get(team.ID) || 0) + 1;
            await Promise.all([
                mpLobby.abortMatch(),
                mpChannel.sendMessage(`${username} has triggered an abort${typeof matchup.stage!.tournament.teamAbortLimit === "number" ? `, they now have ${matchup.stage!.tournament.teamAbortLimit - abortCount} aborts left` : ""}`),
            ]);
            aborts.set(team.ID, abortCount);
        } else if (
            team && 
            typeof matchup.stage!.tournament.teamAbortLimit === "number" && 
            aborts.get(team.ID) && 
            aborts.get(team.ID)! >= matchup.stage!.tournament.teamAbortLimit
        )
            await mpChannel.sendMessage(`${username} has triggered an abort but the team has reached their abort limit`);
    };

    mpChannel.on("message", async (message) => {
        const user = await getUserInMatchup(users, message);
        const matchupMessage = new MatchupMessage();
        matchupMessage.timestamp = new Date();
        matchupMessage.content = message.content;
        matchupMessage.matchup = matchup;
        matchupMessage.user = user;
        matchup.messages!.push(matchupMessage);

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
                await mpChannel.sendMessage("u guys are taking WAY TOO LONG TO READY UP im starting the match now and kicking any extra players in a team at random");
                setTimeout(async () => {
                    if (!autoStart)
                        return;
                    await kickExtraPlayers(matchup, playersInLobby, mpLobby);
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
                message.message === "!stop"
            ) && 
            mpLobby.playing &&
            playersInLobby.some(p => p.user.id === message.user.id)
        )
            await abortMap(message.user);
        else if (message.message === "!panic" || message.message === "!alert") {
            if (refCollector?.channelId) {
                const discordChannel = discordClient.channels.cache.get(refCollector.channelId);
                if (!(discordChannel instanceof TextChannel)) {
                    await message.user.sendMessage(`No ref channel found`);
                    return;
                }

                await discordChannel.send(`@here <@${matchup.stage!.tournament.organizer.discord.userID}> ${matchup.referee ? `<@${matchup.referee.discord.userID}>` : ""} ${matchup.streamer ? `<@${matchup.streamer.discord.userID}>` : ""}\n${message.user.username} is PANICING for the matchup Omggg go helkp them\n\nAuto-running lobby has stopped`);

                state.matchups[matchup.ID].autoRunning = false;

                await mpChannel.sendMessage(`ok i notified the refs and organizer(s) of the tourney and stopped the auto lobby for u`);
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

        if (started || mpLobby.playing || !state.matchups[matchup.ID].autoRunning)
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

        if (!state.matchups[matchup.ID].autoRunning)
            return;

        if (mapTimerStarted)
            await mpLobby.abortTimer();

        if (
            mpLobby.playing &&
            playersInLobby.some(p => p.user.id === player.user.id)
        )
            await abortMap(player);

        playersInLobby = playersInLobby.filter(p => p.user.id !== player.user.id);
    });

    // All players ready event
    mpLobby.on("allPlayersReady", async () => {
        await mpLobby.updateSettings();

        if (mapsPlayed.some(m => m.beatmap!.ID === mpLobby.beatmapId) || !state.matchups[matchup.ID].autoRunning)
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
        if (!state.matchups[matchup.ID].autoRunning)
            return;

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
        if (!state.matchups[matchup.ID].autoRunning)
            return;

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

        const matchupMap = new MatchupMap;
        matchupMap.matchup = matchup;
        matchupMap.map = beatmap;
        matchupMap.order = mapsPlayed.length;
        await matchupMap.save();

        matchupMap.scores = await Promise.all(scores.map(async (score) => {
            const user = users.find(u => u.osu.userID === score.userId.toString());
            if (!user) {
                await mpChannel.sendMessage(`YO I CAN'T FIND THE USER IN SLOT ${score.slot} (ID ${score.userId}) IN THE MATCHUP GET CORSACE STAFF IMMEDIATELY`);
                throw new Error("User not found");
            }
            const matchupScore = new MatchupScore;
            matchupScore.user = user;
            matchupScore.map = matchupMap;
            matchupScore.score = score.score;
            matchupScore.mods = ((score.enabledMods || game.mods) | 1) ^ 1; // Remove NF from mods (the OR 1 is to ensure NM is 0 after XOR)
            matchupScore.misses = score.countMiss;
            matchupScore.combo = score.maxCombo;
            matchupScore.fail = !score.pass;
            matchupScore.accuracy = (score.count50 + 2 * score.count100 + 6 * score.count300) / Math.max(6 * (score.countMiss + score.count50 + score.count100 + score.count300), 1);
            matchupScore.fullCombo = score.perfect || score.maxCombo === beatmap.beatmap!.maxCombo;
            return matchupScore.save();
        }));
        matchup.maps!.push(matchupMap);

        log(matchup, `Matchup map and scores saved with matchupMap ID ${matchupMap.ID}`);

        if (!state.matchups[matchup.ID].autoRunning)
            return;

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
            invCollector?.stop();
            refCollector?.stop();
            await matchup.save();
    
            clearInterval(messageSaver);

            state.runningMatchups--;
            delete state.matchups[matchup.ID];
            maybeShutdown();
        }
    });
}

export default async function runMatchup (matchup: Matchup, replace = false) {
    runMatchupCheck(matchup, replace);

    let lobbyName = `${matchup.stage!.tournament.abbreviation}: (${matchup.team1?.name}) vs (${matchup.team2?.name})`;
    if (matchup.stage!.stageType === StageType.Qualifiers)
        lobbyName = `${matchup.stage!.tournament.abbreviation}: (${convertDateToDDDHH(matchup.date)} QL) vs (${matchup.teams?.map(team => team.abbreviation).join(", ")})`;

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
                content: `Lobby has been created for \`${lobbyName}\`, if u need to be added or readded as a ref, and u have a role considered unallowed to play, press the button below.\nMake sure u are online on osu! for the addref to work`,
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
                content: `${IDs.map(id => `<@${id.discord}>`).join(" ")}\n\nLobby has been created for ur match, if u need to be reinvited, press the button below.\n\nMake sure u have non-friends DMs allowed on osu!\n\nThe following commands work in lobby:\n\`!panic\` will notify organizers/currently assigned refs if anything goes absurdly wrong and stop auto-running the lobby\n\`!abort\` allows u to abort a map within the allowed time after a map start, and for the allowed amount of times a team is allowed to abort\n\nIf ur not part of the matchup, the button wont work for u .`,
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
                await invMessage.delete();
            });
            log(matchup, `Created invite message for ${IDs.length} players`);
        }
    }

    await runMatchupListeners(matchup, mpLobby, mpChannel, invCollector, refCollector);
}