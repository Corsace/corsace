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
    setKey (state, data) {
        state.key = data.key;
        state.tournamentID = data.tournamentID;
    },
    async setScores (state, scores: MatchupScore[] | undefined) {
        state.scores = scores || null;
    },
};

export const getters: GetterTree<StreamState, OpenState> = {
};

export const actions: ActionTree<StreamState, OpenState> = {
    async setScores ({ commit }, stageID) {
        const state = this.state as any;
        const { data } = await this.$axios.get(`/api/tournament/${state.stream.tournamentID}/${stageID}/scores?key=${state.stream.key}`);

        if (!data.error)
            commit("setScores", data);
    },
    async setInitialData ({ commit, dispatch }, payload) {
        if (!payload.key)
            return;

        const { data } = await this.$axios.get(`/api/tournament/validateKey?key=${payload.key}`);

        if (data.error)
            return;

        commit("setKey", {
            key: payload.key,
            tournamentID: data.tournamentID,
        });

        if (payload.stageID && !isNaN(parseInt(payload.stageID)))
            await dispatch("setScores", parseInt(payload.stageID));
    },
};