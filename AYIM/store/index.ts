import { ActionTree, MutationTree, GetterTree } from "vuex";
import { UserMCAInfo } from "../../Interfaces/user";
import { MCA } from "../../Interfaces/mca";

const modeRegex = /^(standard|taiko|fruits|mania|storyboard)$/;

export interface RootState {
    loggedInUser: null | UserMCAInfo;
    selectedMode: string;
    modes: string[];
    mca: MCA | null;
}

export const state = (): RootState => ({
    loggedInUser: null,
    selectedMode: "standard",
    modes: ["standard", "taiko", "fruits", "mania", "storyboard"],
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
    isHeadStaff (state): boolean {
        if (!state.loggedInUser) return false;

        return state.loggedInUser.staff.corsace || 
            state.loggedInUser.staff.headStaff;
    },
};

export const actions: ActionTree<RootState, RootState> = {
    async setLoggedInUser ({ commit }) {
        const { data } = await this.$axios.get(`/api/user`);

        if (!data.error) {
            commit("setLoggedInUser", data);
        }
    },
    async updateMCA ({ commit }, year: number) {
        const { data } = await this.$axios.get(`/api/mca?year=${year}`);

        if (!data.error) {
            commit("updateMCA", data);
        }
    },
    async setInitialData ({ dispatch }, year: number) {
        await Promise.all([
            dispatch("setLoggedInUser"),
            dispatch("updateMCA", year),
        ]);
    },
    setSelectedMode ({ commit }) {
        commit("setSelectedMode");
    },
    updateSelectedMode ({ commit }, mode) {
        commit("updateSelectedMode", mode);
    },
};
