import { ActionTree, MutationTree, GetterTree } from "vuex";
import axios from "axios";
import { MCAInfo } from "../../Interfaces/mca";
import { RootState } from "./index";

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
    async setMca ({ commit }) {
        const { data } = await axios.get(`/api/staff`);

        if (!data.error) {
            commit("setMca", data);
        }
    },
    async setInitialData ({ dispatch }) {
        await Promise.all([
            dispatch("setMca"),
        ]);
    },
};
