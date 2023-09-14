import { ActionTree, MutationTree, GetterTree } from "vuex";
import { RootState } from "../../Assets/store/mca-ayim";
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
        const { data } = await this.$axios.get<{ mca: MCAInfo }>(`/api/staff/${year}`);

        if (data.success) {
            commit("setMca", data.mca);
        }
    },
    async setInitialData ({ dispatch }, year: number) {
        await dispatch("setMca", year);
    },
};
