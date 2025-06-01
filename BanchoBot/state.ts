import { BanchoLobby } from "bancho.js";
import { EventEmitter } from "node:events";
import { Matchup } from "../Models/tournaments/matchup";
import { maybeShutdown } from "./index";

type MatchupState = Record<number, MatchupList>;
export interface MatchupList {
    matchup: Matchup;
    lobby: BanchoLobby;
    autoRunning: boolean;
}

const state = {
    receivedShutdownSignal: false,
    shuttingDown: false,
    runningMatchups: 0,
    matchups: {} as MatchupState,
    events: new EventEmitter() as unknown as {
        /* eslint-disable @typescript-eslint/adjacent-overload-signatures */
        addListener(event: "matchupAdded", listener: (matchupID: number, matchup: MatchupList) => void): EventEmitter;
        on(event: "matchupAdded", listener: (matchupID: number, matchup: MatchupList) => void): EventEmitter;
        once(event: "matchupAdded", listener: (matchupID: number, matchup: MatchupList) => void): EventEmitter;
        removeListener(event: "matchupAdded", listener: (matchupID: number, matchup: MatchupList) => void): EventEmitter;
        off(event: "matchupAdded", listener: (matchupID: number, matchup: MatchupList) => void): EventEmitter;
        emit(event: "matchupAdded", matchupID: number, matchup: MatchupList): boolean;
        prependListener(event: "matchupAdded", listener: (matchupID: number, matchup: MatchupList) => void): EventEmitter;
        prependOnceListener(event: "matchupAdded", listener: (matchupID: number, matchup: MatchupList) => void): EventEmitter;

        addListener(event: "matchupRemoved", listener: (matchupID: number, matchup: MatchupList) => void): EventEmitter;
        on(event: "matchupRemoved", listener: (matchupID: number, matchup: MatchupList) => void): EventEmitter;
        once(event: "matchupRemoved", listener: (matchupID: number, matchup: MatchupList) => void): EventEmitter;
        removeListener(event: "matchupRemoved", listener: (matchupID: number, matchup: MatchupList) => void): EventEmitter;
        off(event: "matchupRemoved", listener: (matchupID: number, matchup: MatchupList) => void): EventEmitter;
        emit(event: "matchupRemoved", matchupID: number, matchup: MatchupList): boolean;
        prependListener(event: "matchupRemoved", listener: (matchupID: number, matchup: MatchupList) => void): EventEmitter;
        prependOnceListener(event: "matchupRemoved", listener: (matchupID: number, matchup: MatchupList) => void): EventEmitter;
        /* eslint-enable @typescript-eslint/adjacent-overload-signatures */

        removeAllListeners(event?: "matchupAdded" | "matchupRemoved"): EventEmitter;
        listeners(event: "matchupAdded" | "matchupRemoved"): (() => void)[];
        rawListeners(event: "matchupAdded" | "matchupRemoved"): (() => void)[];
        listenerCount(event: "matchupAdded" | "matchupRemoved"): (() => void)[];
        eventNames(): ("matchupAdded" | "matchupRemoved")[];
    },
    addMatchup (matchupID: number, matchup: MatchupList) {
        state.matchups[matchupID] = matchup;
        state.runningMatchups++;
        state.events.emit("matchupAdded", matchupID, matchup);
    },
    removeMatchup (matchupID: number) {
        if (state.matchups[matchupID]) {
            const matchup = state.matchups[matchupID];
            delete state.matchups[matchupID];
            state.runningMatchups--;
            state.events.emit("matchupRemoved", matchupID, matchup);
            void maybeShutdown();
        } else
            console.error(`Tried to remove matchup ${matchupID}, but it was not found in the state.`);
    },
};

export default state;
