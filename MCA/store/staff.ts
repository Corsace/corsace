import { ActionTree, MutationTree, GetterTree } from "vuex";
import axios from "axios";
import { MCAInfo } from "../../Interfaces/mca";
import { GuestRequest } from "../../Interfaces/guestRequests";
import { CategoryInfo } from "../../Interfaces/category";
import { RootState } from "./index";

export interface UpdateRequestData {
    id: number;
    status: number;
}

export interface StaffState {
    mca: MCAInfo | null;
    categories: CategoryInfo[];
    requests: GuestRequest[];
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
    async setMca ({ commit }) {
        const { data } = await axios.get(`/api/staff`);

        if (!data.error) {
            commit("setMca", data);
        }
    },
    async setCategories ({ commit }) {
        const { data } = await axios.get(`/api/staff/categories`);

        if (!data.error) {
            commit("setCategories", data);
        }
    },
    async setRequests ({ commit }) {
        const { data } = await axios.get(`/api/staff/requests`);

        if (!data.error) {
            commit("setRequests", data);
        }
    },
    async setInitialData ({ dispatch }) {
        await Promise.all([
            dispatch("setMca"),
            dispatch("setCategories"),
            dispatch("setRequests"),
        ]);
    },
    async updateRequest ({ commit }, payload: UpdateRequestData) {
        const { data } = await axios.post(`/api/staff/requests/${payload.id}/update`, {
            status: payload.status,
        });

        if (!data.error) {
            commit("updateRequest", payload);
        }
    },
};
