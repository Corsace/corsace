import { ActionTree, MutationTree, GetterTree } from "vuex";
import axios from "axios";

export interface TeamsState {
    teams: [],
    active: false | boolean,
    loading: true | boolean,
}

export const mutations: MutationTree<TeamsState> = {
    setTeams (state, teams ) {
        state.teams = teams;
    },

    toggleActive (state) {
        state.active = !state.active
    },

    setLoadingFalse (state, bool) {
        state.loading = false;
    },

    setLoadingTrue (state, bool) {
        state.loading = true;
    }
};

export const actions: ActionTree<TeamsState, any> = {
    async fetchAllTeams ({ commit }) {
        console.log('ran fetch')
        commit("setLoadingTrue");
        const { data } = (await axios.get("/api/team/all")) //.data.teams; This doesn't work right now, I'm assuming its because the endpoint doesn't exist yet
        for (var i = 0; i < data.length; i++) {
            data[i].averagePp = Math.round(data[i].averagePp);
        }

        if (!data.error) {
            commit("addTeam", data);
        }
        commit("setLoadingFalse");
    },


};
