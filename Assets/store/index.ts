import { ActionTree, MutationTree, GetterTree } from "vuex";
import { UserInfo } from "../../Interfaces/user";

const themeRegex = /^(light|dark)$/;

export interface BaseState {
    loggedInUser: null | UserInfo;
    viewTheme: "light" | "dark";
}

export const state = (): BaseState => ({
    loggedInUser: null,
    viewTheme: "light", 
});

export const mutations: MutationTree<BaseState> = {
    setLoggedInUser (state, user) {
        state.loggedInUser = user;
    },
    setViewTheme (state) {
        const localTheme = localStorage.getItem("theme");

        if (localTheme && themeRegex.test(localTheme))
            state.viewTheme = localTheme as "light" | "dark";
    },
    updateViewTheme (state, theme) {
        if (themeRegex.test(theme)) {
            state.viewTheme = theme;
            localStorage.setItem("theme", theme);
        }
    },
};

export const getters: GetterTree<BaseState, BaseState> = {
};

export const actions: ActionTree<BaseState, BaseState> = {
    async setLoggedInUser ({ commit }) {
        const { data } = await this.$axios.get(`/api/user`);

        if (!data.error) {
            commit("setLoggedInUser", data);
        }
    },
    async setViewTheme ({ commit }) {
        commit("setViewTheme");
    },
    async updateViewTheme ({ commit }, theme) {
        commit("updateViewTheme", theme);
    },
    async setInitialData ({ dispatch }) {
        await Promise.all([
            dispatch("setLoggedInUser"),
            dispatch("setViewTheme"),
        ]);
    },
};