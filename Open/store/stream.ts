import { ActionTree, MutationTree, GetterTree } from "vuex";
import { MatchupScore } from "../../Interfaces/matchup";
import { OpenState } from "./open";

export interface StreamState {
    key: string | null;
    tournamentID: number | null;
    scores: MatchupScore[] | null;
}

export const state = (): StreamState => ({
    key: null,
    tournamentID: null,
    scores: null,
});

export const mutations: MutationTree<StreamState> = {
    setKey (streamState, data: { key: string, tournamentID?: number }) {
        streamState.key = data.key;
        streamState.tournamentID = data.tournamentID ?? null;
    },
    setScores (streamState, scores: MatchupScore[] | undefined) {
        streamState.scores = scores ?? null;
    },
};

export const getters: GetterTree<StreamState, OpenState> = {
};

export const actions: ActionTree<StreamState, OpenState> = {
    async setScores ({ commit }, stageID) {
        const generalState = this.state as any;
        const { data } = await this.$axios.get<{ scores: MatchupScore[] }>(`/api/stage/${stageID}/scores?key=${generalState.stream.key}`);

        if (data.success)
            commit("setScores", data.scores);
    },
    async setInitialData ({ commit, dispatch }, payload: { key: string, stageID: string | (string | null)[] }) {
        if (!payload.key)
            return;

        const { data } = await this.$axios.get<{ tournamentID?: number }>(`/api/tournament/validateKey?key=${payload.key}`);

        if (!data.success)
            return;

        commit("setKey", {
            key: payload.key,
            tournamentID: data.tournamentID,
        });

        if (typeof payload.stageID === "string" && !isNaN(parseInt(payload.stageID)))
            await dispatch("setScores", parseInt(payload.stageID));
    },
};
