import { ActionTree, MutationTree, GetterTree } from "vuex";
import axios from "axios";

export interface TalentState {
    headStaff: [],
    poolers: [],
    referees: [],
    streamcomms: [],
    schedulers: [],
}

export const mutations: MutationTree<TalentState> = {

    setHeadStaff (state, staff) {
        state.headStaff = staff
    },
    setPoolers (state, staff) {
        state.poolers = staff
    },
    setReferees (state, staff) {
        state.referees = staff
    },
    setStreamcomms (state, staff) {
        state.streamcomms = staff
    },
    setSchedulers (state, staff) {
        state.schedulers = staff
    },
};

export const actions: ActionTree<TalentState, any> = {
    async fetchStaff ({ commit }) {
        try {
            const res = await axios.get("/api/user/staff");
            const  { headStaff, poolers, referees, streamcomms, schedulers } = res.data
            commit("setHeadStaff", headStaff)
            commit("setPoolers", poolers)
            commit("setReferees", referees)
            commit("setStreamcomms", streamcomms)
            commit("setSchedulers", schedulers)

        } catch (err) {
            alert(err)
        }
    },


};
