import { ActionTree, MutationTree, GetterTree } from "vuex";
import axios from "axios";
import { TeamInfo } from "../../Interfaces/team"
import { UserOpenInfo } from "../../Interfaces/user";
import { TIMEOUT } from "dns";

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

    setAveragePp (state, index) {
        state.teams[index].averagePp = Math.round(state.teams[index].averagePp)
    }

};

let testUser: UserOpenInfo = {
    corsaceID: 1,
    discord: {
        avatar: "https://a.ppy.sh/4323406?1625541513.gif",
        userID: "4323406",
        username: "VINXIS",
    },
    osu: {
        avatar: "https://a.ppy.sh/4323406?1625541513.gif",
        userID: "4323406",
        username: "VINXIS",
        otherNames: [],
    },
    staff: {
        corsace: false,
        headStaff: false,
        staff: false,
    },
    joinDate: new Date(2011,10,30),
    lastLogin: new Date(2011,10,30),
    canComment: false,
    team: null,
    pickemPoints: 1,
    rank: 1,
    badges: 1,
}

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
