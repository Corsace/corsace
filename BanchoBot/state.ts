import { BanchoLobby } from "bancho.js";
import { Matchup } from "../Models/tournaments/matchup";

type MatchupState = Record<number, MatchupList>;
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
