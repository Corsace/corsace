import { BanchoLobby } from "bancho.js";
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
    matchups: {} as MatchupList,
};

export default state;
