import { BanchoLobby } from "bancho.js";
import { Matchup } from "../Models/tournaments/matchup";

interface MatchupState {
    [key: number]: MatchupList
}
export interface MatchupList {
    matchup: Matchup;
    lobby: BanchoLobby;
    autoRunning: boolean;
}

const state = {
    shuttingDown: false,
    httpServerShutDown: false,
    runningMatchups: 0,
    matchups: {} as MatchupState,
};

export default state;
