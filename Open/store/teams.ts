import { ActionTree, MutationTree, GetterTree } from "vuex";

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
        commit("setLoadingTrue");
        const { data } = await (await this.$axios.get(`/api/team/all`)).data.teams;
        for (var i = 0; i < data.length; i++) {
            data[i].averagePp = Math.round(data[i].averagePp);
        }

        if (!data.error) {
            commit("addTeam", data);
        }
        commit("setLoadingFalse");
    },


};
