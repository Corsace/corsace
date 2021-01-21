import { ActionTree, MutationTree, GetterTree } from "vuex";
import axios from "axios";
import { UserMCAInfo } from "../../Interfaces/user";
import { MCA } from "../../Interfaces/mca";

const modeRegex = /^(standard|taiko|fruits|mania|storyboard)$/;

export interface RootState {
    loggedInUser: null | UserMCAInfo;
    selectedMode: string;
    modes: string[];
    year: number;
    mca: MCA | null;
}

export const state = (): RootState => ({
    loggedInUser: null,
    selectedMode: "standard",
    modes: ["standard", "taiko", "fruits", "mania", "storyboard"],
    year: new Date().getFullYear() - 1,
    mca: null,
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
    updateYear (state, year) {
        state.year = year;
    },
    updateMCA (state, mca) {
        state.mca = mca;
    },
};

export const getters: GetterTree<RootState, RootState> = {
    isMCAStaff (state): boolean {
        if (!state.loggedInUser) return false;

        return state.loggedInUser.staff.corsace || 
            state.loggedInUser.staff.headStaff || 
            state.loggedInUser.mcaStaff.standard ||
            state.loggedInUser.mcaStaff.taiko ||
            state.loggedInUser.mcaStaff.mania ||
            state.loggedInUser.mcaStaff.fruits ||
            state.loggedInUser.mcaStaff.storyboard;
    },
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
    async updateYear ({ commit }, year) {
        commit("updateYear", year);
        
        const { data } = await axios.get(`/api/mca`);

        if (!data.error) {
            commit("updateMCA", data);
        }
    },
};
