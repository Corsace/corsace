import { ActionTree, MutationTree, GetterTree } from "vuex";
import { UserInfo } from "../../Interfaces/user";

const themeRegex = /^(light|dark)$/;

export interface BaseState {
    site: string;
    loggedInUser: null | UserInfo;
    viewTheme: "light" | "dark";
}

export const state = (): BaseState => ({
    site: "",
    loggedInUser: null,
    viewTheme: "light", 
});

export const mutations: MutationTree<BaseState> = {
    setLoggedInUser (state, user) {
        state.loggedInUser = user;
    },
    setViewTheme (state, defaultTheme: "light" | "dark") {
        const localTheme = localStorage.getItem("theme");

        if (localTheme && themeRegex.test(localTheme))
            state.viewTheme = localTheme as "light" | "dark";
        else
            state.viewTheme = defaultTheme;
    },
    updateViewTheme (state, theme) {
        if (themeRegex.test(theme)) {
            state.viewTheme = theme;
            localStorage.setItem("theme", theme);
        }
    },
    setSite (state, site) {
        state.site = site;
    },
};

export const getters: GetterTree<BaseState, BaseState> = {
    isHeadStaff (state): boolean {
        if (!state.loggedInUser) return false;

        return state.loggedInUser.staff.corsace || 
            state.loggedInUser.staff.headStaff;
    },
};

export const actions: ActionTree<BaseState, BaseState> = {
    async setLoggedInUser ({ commit }) {
        const { data } = await this.$axios.get<{ user: UserInfo }>(`/api/user`);

        if (data.success)
            commit("setLoggedInUser", data.user);
    },
    setViewTheme ({ commit }, defaultTheme: "light" | "dark") {
        commit("setViewTheme", defaultTheme);
    },
    updateViewTheme ({ commit }, theme) {
        commit("updateViewTheme", theme);
    },
    async setInitialData ({ commit, dispatch }, site) {
        commit("setSite", site);
        await dispatch("setLoggedInUser");
    },
};