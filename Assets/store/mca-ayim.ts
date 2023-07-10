import Vue from "vue";
import { ActionTree, MutationTree, GetterTree } from "vuex";
import { MCA, MCAInfo, MCAPhase, PhaseType } from "../../Interfaces/mca";
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
    loggedInMCAUser: null | UserMCAInfo;
    mca: MCA | null;
    allMCA: MCAInfo[];
    selectedMode: string;
    modes: string[];
    showGuestDifficultyModal: boolean,
}

export const state = (): RootState => ({
    loggedInMCAUser: null,
    mca: null,
    allMCA: [],
    selectedMode: "",
    modes: ["standard", "taiko", "fruits", "mania", "storyboard"],
    showGuestDifficultyModal: false,
});

export const mutations: MutationTree<RootState> = {
    setLoggedInMCAUser (state, user) {
        state.loggedInMCAUser = user;
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
            document.documentElement.style.setProperty("--selected-mode", `var(--${localMode})`);
        }
    },
    updateSelectedMode (state, mode) {
        if (modeRegex.test(mode) || mode === "") {
            state.selectedMode = mode;
            localStorage.setItem("mode", mode);
            document.documentElement.style.setProperty("--selected-mode", `var(--${mode})`);
        }
    },

    addGuestRequest (state, request: GuestRequest) {
        if (!request || !state.loggedInMCAUser) return;

        state.loggedInMCAUser.guestRequests.push(request);
    },
    updateGuestRequest (state, request: GuestRequest) {
        if (!request || !state.loggedInMCAUser) return;

        const i = state.loggedInMCAUser.guestRequests.findIndex(r => r.ID === request.ID);
        if (i !== -1) Vue.set(state.loggedInMCAUser.guestRequests, i, request);
    },
    toggleGuestDifficultyModal (state) {
        state.showGuestDifficultyModal = !state.showGuestDifficultyModal;
    },
};

export const getters: GetterTree<RootState, RootState> = {
    phase (state): MCAPhase | undefined {
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
        if (!state.loggedInMCAUser) return false;

        return state.loggedInMCAUser.staff.corsace || 
            state.loggedInMCAUser.staff.headStaff || 
            state.loggedInMCAUser.mcaStaff.standard ||
            state.loggedInMCAUser.mcaStaff.taiko ||
            state.loggedInMCAUser.mcaStaff.mania ||
            state.loggedInMCAUser.mcaStaff.fruits ||
            state.loggedInMCAUser.mcaStaff.storyboard;
    },
    isHeadStaff (state): boolean {
        if (!state.loggedInMCAUser) return false;

        return state.loggedInMCAUser.staff.corsace || 
            state.loggedInMCAUser.staff.headStaff;
    },
    isEligibleFor (state) {
        return (mode: string): boolean => {
            if (state.loggedInMCAUser?.staff?.headStaff) {
                return true;
            }
    
            if (state.loggedInMCAUser?.eligibility) {
                const eligibility = state.loggedInMCAUser?.eligibility?.find(e => e.year === state.mca?.year);

                return eligibility?.[mode];
            }
        
            return false;
        };
    },
    inactiveModes (state): string[] {
        if (!state.loggedInMCAUser) return [];

        const eligibility = state.loggedInMCAUser.eligibility.find(e => e.year === state.mca?.year);

        if (!eligibility) return state.modes;

        return state.modes.filter(m => !eligibility[m]);
    },
};

export const actions: ActionTree<RootState, RootState> = {
    async setLoggedInMCAUser ({ commit }) {
        const { data } = await this.$axios.get(`/api/user/mca`);

        if (!data.error) {
            commit("setLoggedInMCAUser", data);
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
            dispatch("setLoggedInMCAUser"),
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
