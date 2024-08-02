import { ActionTree, MutationTree, GetterTree } from "vuex";
import { RootState } from "../../Assets/store/mca-ayim";
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
    setMca (staffState, mca) {
        staffState.mca = mca;
    },
    setCategories (staffState, categories) {
        staffState.categories = categories || [];
    },
    setRequests (staffState, requests) {
        staffState.requests = requests || [];
    },
    updateRequest (staffState, payload: UpdateRequestData) {
        const i = staffState.requests.findIndex(r => r.ID === payload.id);
        if (i !== -1) staffState.requests[i].status = payload.status;
    },
};

export const getters: GetterTree<StaffState, RootState> = {

};

export const actions: ActionTree<StaffState, RootState> = {
    async setMca ({ commit }, year: number) {
        const { data } = await this.$axios.get<{ mca: MCAInfo }>(`/api/staff/mca/${year}`);

        if (data.success) {
            commit("setMca", data.mca);
        }
    },
    async setCategories ({ commit }, year: number) {
        const { data } = await this.$axios.get<{ categories: CategoryInfo[] }>(`/api/staff/mca/categories/${year}`);

        if (data.success) {
            commit("setCategories", data.categories);
        }
    },
    async setRequests ({ commit }, year: number) {
        const { data } = await this.$axios.get<{ requests: StaffGuestRequest[] }>(`/api/staff/requests/${year}`);

        if (data.success) {
            commit("setRequests", data.requests);
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

        if (data.success) {
            commit("updateRequest", payload);
        }
    },
};
