import { ActionTree, MutationTree, GetterTree } from "vuex";
import axios from "axios";
import { TeamInfo } from "../../Interfaces/team"
import { UserOpenInfo } from "../../Interfaces/user";
import { TIMEOUT } from "dns";

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

//remember to delete
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
    pp: 14000,
    openStaff: {
        isMappooler: false
    }
}
let testUser2: UserOpenInfo = {
    corsaceID: 2,
    discord: {
        avatar: "https://a.ppy.sh/4323406?1625541513.gif",
        userID: "4323406",
        username: "VINXIS",
    },
    osu: {
        avatar: "https://a.ppy.sh/11489119?1622490975.jpeg",
        userID: "11489119",
        username: "crabbapples",
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
    pp: 14000,
    openStaff: {
        isMappooler: false
    }
}

let TestTeam1: TeamInfo = {
    id: 123,
    name: "test1",
    captain: 1,
    averagePp: 5,
    teamAvatarUrl: "https://a.ppy.sh/4323406?1625541513.gif",
    slug: "test",
    averageBWS: 6,
    seed: "A",
    rank: 1,
    members: [testUser, testUser2, testUser2, testUser2, testUser2, testUser2 ,testUser2, testUser2],
    scores: []
}

let testteams: TeamInfo[] = [TestTeam1, TestTeam1]



export const actions: ActionTree<TeamsState, any> = {
    async fetchAllTeams ({ commit, state }) {
        //try {
            commit("setTeams", testteams)//(await axios.get("/api/team/all")).data.teams)
            for (var i = 0; i < state.teams.length; i++) {
                commit("setAveragePp", i)
            }
        //} catch (e) {
        //    alert("Teams are currently unavailable right now. Please try again later!");
        //}
    },


};
