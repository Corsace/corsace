import { ActionTree, MutationTree, GetterTree } from "vuex";
import { RootState } from "../../MCA-AYIM/store/index";
import { MCAInfo } from "../../Interfaces/mca";
import { StaffGuestRequest } from "../../Interfaces/guestRequests";
import { CategoryInfo } from "../../Interfaces/category";

export interface UpdateRequestData {
    id: number;
    status: number;
}

export interface StaffState {
    mca: MCAInfo | null;
    categories: CategoryInfo[];
    requests: StaffGuestRequest[];
}

export const state = (): StaffState => ({
    mca: null,
    categories: [],
    requests: [],
});

export const mutations: MutationTree<StaffState> = {
    setMca (state, mca) {
        state.mca = mca;
    },
    setCategories (state, categories) {
        state.categories = categories || [];
    },
    setRequests (state, requests) {
        state.requests = requests || [];
    },
    updateRequest (state, payload: UpdateRequestData) {
        const i = state.requests.findIndex(r => r.ID === payload.id);
        if (i !== -1) state.requests[i].status = payload.status;
    },
};

export const getters: GetterTree<StaffState, RootState> = {

};

export const actions: ActionTree<StaffState, RootState> = {
    async setMca ({ commit }, year: number) {
        const { data } = await this.$axios.get(`/api/staff/${year}`);

        if (!data.error) {
            commit("setMca", data);
        }
    },
    async setCategories ({ commit }, year: number) {
        const { data } = await this.$axios.get(`/api/staff/categories/${year}`);

        if (!data.error) {
            commit("setCategories", data);
        }
    },
    async setRequests ({ commit }, year: number) {
        const { data } = await this.$axios.get(`/api/staff/requests/${year}`);

        if (!data.error) {
            commit("setRequests", data);
        }
    },
    async setInitialData ({ dispatch }, year: number) {
        await Promise.all([
            dispatch("setMca", year),
            dispatch("setCategories", year),
            dispatch("setRequests", year),
        ]);
    },
    async updateRequest ({ commit }, payload: UpdateRequestData) {
        const { data } = await this.$axios.post(`/api/staff/requests/${payload.id}/update`, {
            status: payload.status,
        });

        if (!data.error) {
            commit("updateRequest", payload);
        }
    },
};
