import { ActionTree, MutationTree, GetterTree } from "vuex";
import axios from "axios";
import { TeamInfo } from "../../Interfaces/team"

// probably not necessary for this page to have a store?
export interface TeamsState {
    teams: TeamInfo[]
}

export const mutations: MutationTree<TeamsState> = {

    setAveragePp (state, index) {
        state.teams[index].averagePp = Math.round(state.teams[index].averagePp)
    },

    setTeams (state, teams) {
        state.teams = teams
    }

};

export const actions: ActionTree<TeamsState, any> = {
    async fetchAllTeams ({ commit, state }) {
        try {
            commit("setTeams", (await axios.get("/api/team/all")).data.teams)
            for (var i = 0; i < state.teams.length; i++) {
                commit("setAveragePp", i)
            }
        } catch (e) {
            alert("Teams are currently unavailable right now. Please try again later!");
        }
    },
};
