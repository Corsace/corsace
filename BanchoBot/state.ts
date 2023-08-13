import { BanchoLobby } from "bancho.js";
import { Server } from "socket.io";
import { Matchup } from "../Models/tournaments/matchup";

interface MatchupList {
    [key: number]: {
        matchup: Matchup;
        lobby: BanchoLobby;
        autoRunning: boolean;
    }
}

const state = {
    shuttingDown: false,
    httpServerShutDown: false,
    runningMatchups: 0,
    socket: null as Server | null,
    matchups: {} as MatchupList,
};

export default state;
