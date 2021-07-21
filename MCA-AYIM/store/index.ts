import Vue from "vue";
import { ActionTree, MutationTree, GetterTree } from "vuex";
import { MCA, MCAInfo, Phase, PhaseType } from "../../Interfaces/mca";
import { UserMCAInfo } from "../../Interfaces/user";
import { GuestRequest } from "../../Interfaces/guestRequests";

const modeRegex = /^(standard|taiko|fruits|mania|storyboard)$/;

export interface GuestRequestPayload {
    mode: string;
    url: string;
}

export interface UpdateGuestRequestPayload extends GuestRequestPayload {
    id: number;
}

export interface RootState {
    loggedInUser: null | UserMCAInfo;
    mca: MCA | null;
    allMCA: MCAInfo[];
    selectedMode: string;
    modes: string[];
    showGuestDifficultyModal: boolean,
}

export const state = (): RootState => ({
    loggedInUser: null,
    mca: null,
    allMCA: [],
    selectedMode: "standard",
    modes: ["standard", "taiko", "fruits", "mania", "storyboard"],
    showGuestDifficultyModal: false,
});

export const mutations: MutationTree<RootState> = {
    setLoggedInUser (state, user) {
        state.loggedInUser = user;
    },
    setMCA (state, mca: MCA) {
        if (mca.year)
            state.mca = {
                year: mca.year,
                nomination: {
                    start: new Date(mca.nomination.start),
                    end: new Date(mca.nomination.end),
                },
                voting: {
                    start: new Date(mca.voting.start),
                    end: new Date(mca.voting.end),
                },
                results: new Date(mca.results),
            };
        else
            state.mca = null;
    },

    setAllMCA (state, mcas: MCAInfo[]) {
        state.allMCA = mcas;
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
    phase (state): Phase | undefined {
        if (!state.mca) return undefined;

        let phase: PhaseType = "preparation";
        const newDate = new Date;
        let startDate: Date = newDate;
        let endDate: Date = newDate;
        
        if (newDate > state.mca.nomination.start && newDate < state.mca.nomination.end) {
            phase = "nominating";
            startDate = state.mca.nomination.start;
            endDate = state.mca.nomination.end;
        } else if (newDate > state.mca.voting.start && newDate < state.mca.voting.end) {
            phase = "voting";
            startDate = state.mca.voting.start;
            endDate = state.mca.voting.end;
        } else if (newDate > state.mca.results) {
            phase = "results";
        }

        return { 
            phase,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            year: state.mca.year,
        };
    },
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
    isEligibleFor (state) {
        return (mode: string): boolean => {
            if (state.loggedInUser?.staff?.headStaff) {
                return true;
            }
    
            if (state.loggedInUser?.eligibility) {
                const eligibility = state.loggedInUser?.eligibility?.find(e => e.year === state.mca?.year);

                return eligibility?.[mode];
            }
        
            return false;
        };
    },
    inactiveModes (state): string[] {
        if (!state.loggedInUser) return [];

        const eligibility = state.loggedInUser.eligibility.find(e => e.year === state.mca?.year);

        if (!eligibility) return state.modes;

        return state.modes.filter(m => !eligibility[m]);
    },
};

export const actions: ActionTree<RootState, RootState> = {
    async setLoggedInUser ({ commit }) {
        const { data } = await this.$axios.get(`/api/mca/user`);

        if (!data.error) {
            commit("setLoggedInUser", data);
        }
    },
    async setMCA ({ commit }, year: number) {
        const { data } = await this.$axios.get(`/api/mca?year=${year}`);

        if (!data.error) {
            commit("setMCA", data);
        } else {
            const { data } = await this.$axios.get(`/api/mca/all`);
            commit("setMCA", {});
            commit("setAllMCA", data);
        }
    },
    async setInitialData ({ dispatch }, year: number) {
        await Promise.all([
            dispatch("setLoggedInUser"),
            dispatch("setMCA", year),
        ]);
    },

    setSelectedMode ({ commit }) {
        commit("setSelectedMode");
    },
    updateSelectedMode ({ commit }, mode) {
        commit("updateSelectedMode", mode);
    },

    async submitGuestRequest ({ commit, state }, payload: GuestRequestPayload) {
        if (!state.mca) return;

        const { data } = await this.$axios.post(`/api/guestRequests/create`, {
            mode: payload.mode,
            url: payload.url,
        });

        if (data.error) {
            alert(data.error);
            return;
        }

        commit("addGuestRequest", data);
    },
    async updateGuestRequest ({ commit, state }, payload: UpdateGuestRequestPayload) {
        if (!state.mca) return;

        const { data } = await this.$axios.post(`/api/guestRequests/${payload.id}/update`, {
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
