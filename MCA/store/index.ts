import { ActionTree, MutationTree, GetterTree } from "vuex";
import axios from "axios";
import { Phase } from "../../interfaces/mca";
import { UserMCAInfo } from "../../interfaces/user";

const modeRegex = /^(standard|taiko|fruits|mania|storyboard)$/;

export interface RootState {
    loggedInUser: null | UserMCAInfo;
    phase: null | Phase;
    selectedMode: string;
    modes: string[];
}

export const state = (): RootState => ({
    loggedInUser: null,
    phase: null,
    selectedMode: "standard",
    modes: ["standard", "taiko", "fruits", "mania", "storyboard"],
});

export const mutations: MutationTree<RootState> = {
    setLoggedInUser (state, user) {
        state.loggedInUser = user;
    },
    setPhase (state, phase) {
        state.phase = phase;
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
    eligible (state): boolean {
        if (state.loggedInUser?.staff?.headStaff)
            return true;

        if (state.loggedInUser?.eligibility)
            for (const eligibility of state.loggedInUser.eligibility) {
                if (
                    eligibility.year === (new Date).getUTCFullYear() - 1 && 
                    eligibility[state.selectedMode]
                )
                    return true;
            }
        
        return false;
    },
};

export const actions: ActionTree<RootState, RootState> = {
    async setLoggedInUser ({ commit }) {
        const { data } = await axios.get(`/api/user`);

        if (!data.error) {
            commit("setLoggedInUser", data);
        }
    },
    async setPhase ({ commit }) {
        const { data } = await axios.get(`/api/phase`);

        if (!data.error) {
            data.startDate = new Date(data.startDate);
            data.endDate = new Date(data.endDate);
            commit("setPhase", data);
        }
    },
    setSelectedMode ({ commit }) {
        commit("setSelectedMode");
    },
    async setInitialData ({ dispatch }) {
        await Promise.all([
            dispatch("setLoggedInUser"),
            dispatch("setPhase"),
            dispatch("setSelectedMode"),
        ]);
    },
    updateSelectedMode ({ commit }, mode) {
        commit("updateSelectedMode", mode);
    },
};
