import { ActionTree, MutationTree, GetterTree } from "vuex";
import axios from "axios";
import { UserMCAInfo } from "../../Interfaces/user";

const modeRegex = /^(standard|taiko|fruits|mania|storyboard)$/;

export interface RootState {
    loggedInUser: null | UserMCAInfo;
    selectedMode: string;
    modes: string[];
}

export const state = (): RootState => ({
    loggedInUser: null,
    selectedMode: "standard",
    modes: ["standard", "taiko", "fruits", "mania", "storyboard"],
});

export const mutations: MutationTree<RootState> = {
    setLoggedInUser (state, user) {
        state.loggedInUser = user;
    },
    setSelectedMode (state) {
        const localMode = localStorage.getItem("mode");

        if (localMode && modeRegex.test(localMode)) {
            state.selectedMode = localMode;
        }
    },
    updateSelectedMode (state, mode) {
        if (modeRegex.test(mode)) {
            state.selectedMode = mode;
            localStorage.setItem("mode", mode);
        }
    },
};

export const getters: GetterTree<RootState, RootState> = {

};

export const actions: ActionTree<RootState, RootState> = {
    async setLoggedInUser ({ commit }) {
        const { data } = await axios.get(`/api/user`);

        if (!data.error) {
            commit("setLoggedInUser", data);
        }
    },
    setSelectedMode ({ commit }) {
        commit("setSelectedMode");
    },
    async setInitialData ({ dispatch }) {
        await Promise.all([
            dispatch("setLoggedInUser"),
            dispatch("setSelectedMode"),
        ]);
    },
    updateSelectedMode ({ commit }, mode) {
        commit("updateSelectedMode", mode);
    },
};
