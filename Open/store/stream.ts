import { ActionTree, MutationTree, GetterTree } from "vuex";
import { OpenState } from "./open";

export interface StreamState {
    key: string | null;
}

export const state = (): StreamState => ({
    key: null,
});

export const mutations: MutationTree<StreamState> = {
    setKey (state, key) {
        state.key = key;
    },
};

export const getters: GetterTree<StreamState, OpenState> = {
};

export const actions: ActionTree<StreamState, OpenState> = {
    async setInitialData ({ commit }, key) {
        const { data } = await this.$axios.get(`/api/tournament/validateKey?key=${key}`);

        if (data.error || !data.valid)
            return;

        await Promise.all([
            commit("setKey", key),
        ]);
    },
};