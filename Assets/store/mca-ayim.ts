import Vue from "vue";
import { ActionTree, MutationTree, GetterTree } from "vuex";
import { MCA, MCAInfo, MCAPhase, PhaseType } from "../../Interfaces/mca";
import { UserMCAInfo } from "../../Interfaces/user";
import { GuestRequest } from "../../Interfaces/guestRequests";
import { ModeDivisionType } from "../../Interfaces/modes";

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
    setLoggedInMCAUser (rootState, user) {
        rootState.loggedInMCAUser = user;
    },
    setMCA (rootState, mca: MCA) {
        if (mca.year)
            rootState.mca = {
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
            rootState.mca = null;
    },

    setAllMCA (rootState, mcas: MCAInfo[]) {
        rootState.allMCA = mcas;
    },

    setSelectedMode (rootState) {
        const localMode = localStorage.getItem("mode");

        if (localMode && modeRegex.test(localMode)) {
            rootState.selectedMode = localMode;
            document.documentElement.style.setProperty("--selected-mode", `var(--${localMode})`);
        }
    },
    updateSelectedMode (rootState, mode) {
        if (modeRegex.test(mode) || mode === "") {
            rootState.selectedMode = mode;
            localStorage.setItem("mode", mode);
            document.documentElement.style.setProperty("--selected-mode", `var(--${mode})`);
        }
    },

    addGuestRequest (rootState, request: GuestRequest) {
        if (!request || !rootState.loggedInMCAUser) return;

        rootState.loggedInMCAUser.guestRequests.push(request);
    },
    updateGuestRequest (rootState, request: GuestRequest) {
        if (!request || !rootState.loggedInMCAUser) return;

        const i = rootState.loggedInMCAUser.guestRequests.findIndex(r => r.ID === request.ID);
        if (i !== -1) Vue.set(rootState.loggedInMCAUser.guestRequests, i, request);
    },
    toggleGuestDifficultyModal (rootState) {
        rootState.showGuestDifficultyModal = !rootState.showGuestDifficultyModal;
    },
};

export const getters: GetterTree<RootState, RootState> = {
    phase (rootState): MCAPhase | undefined {
        if (!rootState.mca) return undefined;

        let phase: PhaseType = "preparation";
        const newDate = new Date();
        let startDate: Date = newDate;
        let endDate: Date = newDate;
        
        if (newDate > rootState.mca.nomination.start && newDate < rootState.mca.nomination.end) {
            phase = "nominating";
            startDate = rootState.mca.nomination.start;
            endDate = rootState.mca.nomination.end;
        } else if (newDate > rootState.mca.voting.start && newDate < rootState.mca.voting.end) {
            phase = "voting";
            startDate = rootState.mca.voting.start;
            endDate = rootState.mca.voting.end;
        } else if (newDate > rootState.mca.results) {
            phase = "results";
        }

        return { 
            phase,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            year: rootState.mca.year,
        };
    },
    isMCAStaff (rootState): boolean {
        if (!rootState.loggedInMCAUser) return false;

        return rootState.loggedInMCAUser.staff.corsace || 
            rootState.loggedInMCAUser.staff.headStaff || 
            rootState.loggedInMCAUser.mcaStaff.standard ||
            rootState.loggedInMCAUser.mcaStaff.taiko ||
            rootState.loggedInMCAUser.mcaStaff.mania ||
            rootState.loggedInMCAUser.mcaStaff.fruits ||
            rootState.loggedInMCAUser.mcaStaff.storyboard;
    },
    isHeadStaff (rootState): boolean {
        if (!rootState.loggedInMCAUser) return false;

        return rootState.loggedInMCAUser.staff.corsace || 
            rootState.loggedInMCAUser.staff.headStaff;
    },
    isEligibleFor (rootState) {
        return (mode: string): boolean => {
            if (rootState.loggedInMCAUser?.staff?.headStaff) {
                return true;
            }
    
            if (rootState.loggedInMCAUser?.eligibility) {
                const eligibility = rootState.loggedInMCAUser?.eligibility?.find(e => e.year === rootState.mca?.year);
                if (eligibility && mode in ModeDivisionType)
                    return eligibility[mode as keyof typeof ModeDivisionType] === true;
            }
        
            return false;
        };
    },
    inactiveModes (rootState): string[] {
        if (!rootState.loggedInMCAUser) return [];

        const eligibility = rootState.loggedInMCAUser.eligibility.find(e => e.year === rootState.mca?.year);

        if (!eligibility) return rootState.modes;

        return rootState.modes.filter(m => m in eligibility ? !eligibility[m as keyof typeof ModeDivisionType] : false);
    },
};

export const actions: ActionTree<RootState, RootState> = {
    async setLoggedInMCAUser ({ commit }) {
        const { data } = await this.$axios.get<{ user: UserMCAInfo }>(`/api/user/mca`);

        if (data.success)
            commit("setLoggedInMCAUser", data.user);
    },
    async setMCA ({ commit }, year: number) {
        const { data: dataYear } = await this.$axios.get<{ mca: MCA }>(`/api/mca?year=${year}`);

        if (dataYear.success)
            commit("setMCA", dataYear.mca);
        else {
            const { data: dataInfo } = await this.$axios.get<{ mca: MCAInfo[] }>(`/api/mca/all`);
            commit("setMCA", {});
            if (dataInfo.success)
                commit("setAllMCA", dataInfo.mca);
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

    async submitGuestRequest ({ commit, state: rootState }, payload: GuestRequestPayload) {
        if (!rootState.mca) return;

        const { data } = await this.$axios.post<{ guestReq: GuestRequest }>(`/api/guestRequests/create`, {
            mode: payload.mode,
            url: payload.url,
        });

        if (!data.success) {
            alert(data.error);
            return;
        }

        commit("addGuestRequest", data.guestReq);
    },
    async updateGuestRequest ({ commit, state: rootState }, payload: UpdateGuestRequestPayload) {
        if (!rootState.mca) return;

        const { data } = await this.$axios.post<{ request: GuestRequest }>(`/api/guestRequests/${payload.id}/update`, {
            mode: payload.mode,
            url: payload.url,
        });

        if (!data.success) {
            alert(data.error);
            return;
        }

        commit("updateGuestRequest", data.request);
    },
};
