import { banchoClient, baseURL, maybeShutdown } from "../../..";
import state from "../../../state";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { StageType, ScoringMethod } from "../../../../Interfaces/stage";
import { BanchoChannel, BanchoLobby, BanchoLobbyPlayer, BanchoLobbyTeamModes, BanchoLobbyWinConditions, BanchoUser } from "bancho.js";
import { randomUUID } from "crypto";
import { TournamentChannel } from "../../../../Models/tournaments/tournamentChannel";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMemberRoleManager, InteractionCollector, MessageComponentInteraction, TextChannel } from "discord.js";
import { discordClient } from "../../../../Server/discord";
import { TournamentRole } from "../../../../Models/tournaments/tournamentRole";
import { unallowedToPlay } from "../../../../Interfaces/tournament";
import { User } from "../../../../Models/user";
import { loginRow } from "../../../../DiscordBot/functions/loginResponse";
import { log } from "./log";
import { MatchupMessage } from "../../../../Models/tournaments/matchupMessage";
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

export default async function runSocketMatchup (matchup: Matchup, mpLobby: BanchoLobby, mpChannel: BanchoChannel, invCollector?: InteractionCollector<any>, refCollector?: InteractionCollector<any>) {
    // Save and store match instance
    state.runningMatchups++;
    state.matchups[matchup.ID] = {
        matchup,
        lobby: mpLobby,
        autoRunning: false,
    };
    matchup.mp = mpLobby.id;
    matchup.baseURL = baseURL;
    await matchup.save();
    log(matchup, `Saved matchup lobby to DB with ID ${mpLobby.id}`);

    const aborts = new Map<number, number>();
    const pools = matchup.round?.mappool || matchup.stage!.mappool!;
    const users = await allAllowedUsersForMatchup(matchup);
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Periodically save messages every 15 seconds
    let lastMessageSaved = Date.now();
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

    mpChannel.on("message", async (message) => {
        if (!state.matchups[matchup.ID])
            return;

        const user = await getUserInMatchup(users, message);
        const matchupMessage = new MatchupMessage();
        matchupMessage.timestamp = new Date();
        matchupMessage.content = message.content;
        matchupMessage.matchup = matchup;
        matchupMessage.user = user;
        matchup.messages!.push(matchupMessage);

        if (message.self)
            return;

        // if (
        //     (
        //         message.message === "!abort" || 
        //         message.message === "!stop" ||
        //         message.message === "!mp abort" || 
        //         message.message === "!mp stop"
        //     ) && 
        //     mpLobby.playing &&
        //     playersInLobby.some(p => p.user.id === message.user.id)
        // )
        //     await abortMap(message.user);
    });


}