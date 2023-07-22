import { BanchoLobby } from "bancho.js";

interface MatchupList {
    [key: number]: {
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
