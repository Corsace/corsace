import Vue from "vue";
import { ActionTree, MutationTree, GetterTree } from "vuex";
import axios from "axios";
import { Phase } from "../../Interfaces/mca";
import { UserMCAInfo } from "../../Interfaces/user";
import { GuestRequest } from "../../Interfaces/guestRequests";

const modeRegex = /^(standard|taiko|fruits|mania|storyboard)$/;

interface GuestRequestPayload {
    mode: string;
    url: string;
}

export interface RootState {
    loggedInUser: null | UserMCAInfo;
    phase: null | Phase;
    selectedMode: string;
    modes: string[];
    showGuestDifficultyModal: boolean,
}

export const state = (): RootState => ({
    loggedInUser: null,
    phase: null,
    selectedMode: "standard",
    modes: ["standard", "taiko", "fruits", "mania", "storyboard"],
    showGuestDifficultyModal: false,
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
    addGuestRequest (state, request: GuestRequest) {
        if (!request || !state.loggedInUser) return;

        state.loggedInUser.guestRequests.push(request);
    },
    updateGuestRequest (state, request: GuestRequest) {
        if (!request || !state.loggedInUser) return;

        const i = state.loggedInUser.guestRequests.findIndex(r => r.ID === request.ID);
        if (i !== -1) Vue.set(state.loggedInUser.guestRequests, i, request);
    },
    toggleGuestDifficultyModal (state) {
        state.showGuestDifficultyModal = !state.showGuestDifficultyModal;
    },
};

export const getters: GetterTree<RootState, RootState> = {
    isEligibleFor (state) {
        return (mode: string, year?: number) => {
            if (state.loggedInUser?.staff?.headStaff) {
                return true;
            }
    
            if (state.loggedInUser?.eligibility) {
                const eligibility = state.loggedInUser?.eligibility?.find(e => e.year === (year || state.phase?.year));

                return eligibility?.[mode];
            }
        
            return false;
        };
    },
    inactiveModes (state): string[] {
        if (!state.loggedInUser) return [];

        const eligibility = state.loggedInUser.eligibility.find(e => e.year === state.phase?.year);

        if (!eligibility) return [];

        return state.modes.filter(m => !eligibility[m]);
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
    async submitGuestRequest ({ commit, state }, payload: GuestRequestPayload) {
        if (!state.phase) return;

        const { data } = await axios.post(`/api/guestRequests/${state.phase.year}/create`, {
            mode: payload.mode,
            url: payload.url,
        });

        if (data.error) {
            alert(data.error);
            return;
        }

        commit("addGuestRequest", data);
    },
    async updateGuestRequest ({ commit, state }, payload: GuestRequestPayload & { id: number }) {
        if (!state.phase) return;

        const { data } = await axios.post(`/api/guestRequests/${state.phase.year}/${payload.id}/update`, {
            mode: payload.mode,
            url: payload.url,
        });

        if (data.error) {
            alert(data.error);
            return;
        }

        commit("updateGuestRequest", data);
    },
};
