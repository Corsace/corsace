import { ActionTree, MutationTree, GetterTree } from "vuex";
import axios from "axios";
import { TeamInfo } from "../../Interfaces/team"

export interface TeamsState {
    teams: TeamInfo[] | TeamInfo[]
    active: false | boolean,
}

export const mutations: MutationTree<TeamsState> = {
    setTeams (state, teams ) {
        state.teams = teams;
    },

    toggleActive (state) {
        state.active = !state.active
    },

};

export const actions: ActionTree<TeamsState, any> = {
    async fetchAllTeams ({ commit }) {
        try {
            const { data } = (await axios.get("/api/team/all")).data.teams;
            for (var i = 0; i < data.length; i++) {
                data[i].averagePp = Math.round(data[i].averagePp);
                if (!data.error) {
                    commit("addTeam", data);
                }
            }
        } catch (e) {
            alert("Teams are currently unavailable right now. Please try again later!");
        }
    },


};
