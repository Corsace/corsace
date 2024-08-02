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
    setLoggedInUser (baseState, user) {
        baseState.loggedInUser = user;
    },
    setViewTheme (baseState, defaultTheme: "light" | "dark") {
        const localTheme = localStorage.getItem("theme");

        if (localTheme && themeRegex.test(localTheme))
            baseState.viewTheme = localTheme as "light" | "dark";
        else
            baseState.viewTheme = defaultTheme;
    },
    updateViewTheme (baseState, theme) {
        if (themeRegex.test(theme)) {
            baseState.viewTheme = theme;
            localStorage.setItem("theme", theme);
        }
    },
    setSite (baseState, site) {
        baseState.site = site;
    },
};

export const getters: GetterTree<BaseState, BaseState> = {
    isHeadStaff (baseState): boolean {
        if (!baseState.loggedInUser) return false;

        return baseState.loggedInUser.staff.corsace || 
            baseState.loggedInUser.staff.headStaff;
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