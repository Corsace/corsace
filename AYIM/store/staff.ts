import { ActionTree, MutationTree, GetterTree } from "vuex";
import { RootState } from "../../MCA-AYIM/store/index";
import { MCAInfo } from "../../Interfaces/mca";

export interface UpdateRequestData {
    id: number;
    status: number;
}

export interface StaffState {
    mca: MCAInfo | null;
}

export const state = (): StaffState => ({
    mca: null,
});

export const mutations: MutationTree<StaffState> = {
    setMca (state, mca) {
        state.mca = mca;
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
    async setInitialData ({ dispatch }, year: number) {
        await dispatch("setMca", year);
    },
};
