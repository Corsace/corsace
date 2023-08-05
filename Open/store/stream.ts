import { ActionTree, MutationTree, GetterTree } from "vuex";
import { QualifierScore } from "../../Interfaces/qualifier";
import { OpenState } from "./open";

export interface StreamState {
    key: string | null;
    tournamentID: number | null;
    scores: QualifierScore[] | null; // TODO: Generic Score Interface
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
    async setScores (state, scores: QualifierScore[] | undefined) {
        state.scores = scores || null;
    },
};

export const getters: GetterTree<StreamState, OpenState> = {
};

export const actions: ActionTree<StreamState, OpenState> = {
    async setScores ({ commit }) {
        const state = this.state as any;
        // TODO: Do not use qualifiers specifically
        const { data } = await this.$axios.get(`/api/tournament/${state.stream.tournamentID}/qualifiers/scores?key=${state.stream.key}`);

        if (!data.error)
            commit("setScores", data);
    },
    async setInitialData ({ commit, dispatch }, key) {
        const { data } = await this.$axios.get(`/api/tournament/validateKey?key=${key}`);

        if (data.error)
            return;

        await commit("setKey", {
            key,
            tournamentID: data.tournamentID,
        });

        await dispatch("setScores");
    },
};