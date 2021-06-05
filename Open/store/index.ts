import { ActionTree, MutationTree, GetterTree } from "vuex";
import { UserInfo } from "../../Interfaces/user";

interface RootState {
    loggedInUser: null | UserInfo;
}

export const state = (): RootState => ({
    loggedInUser: null,
});

export const mutations: MutationTree<RootState> = {
    setLoggedInUser (state, user) {
        state.loggedInUser = user;
    },
};

export const getters: GetterTree<RootState, RootState> = {
};

export const actions: ActionTree<RootState, RootState> = {
    async setLoggedInUser ({ commit }) {
        const { data } = await this.$axios.get(`/api/user`);

        if (!data.error) {
            commit("setLoggedInUser", data);
        }
    },
    async setInitialData ({ dispatch }) {
        await Promise.all([
            dispatch("setLoggedInUser"),
        ]);
    },
};