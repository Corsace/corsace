import { ActionTree, MutationTree, GetterTree } from "vuex";
import { UserOpenInfo } from "../../Interfaces/user";
import { TeamInfo } from "../../Interfaces/team";
import { Invitation } from "../../Interfaces/invitation";
import axios from "axios";
import { QualifierInfo, QualifierLobby } from "../../Interfaces/qualifier";
import { MappoolInfo, MappoolMap, ModGroup } from "../../Interfaces/mappool";

interface RootState {
    loggedInUser: null | UserOpenInfo;
    discordReg: boolean;
    noNotifications: boolean;
    registered: boolean; 
    team: null | TeamInfo;
    teamRegistering: boolean;
    userInvitations: Invitation[];
    site: string;
}

export const state = (): RootState => ({
    loggedInUser: null,
    discordReg: false,
    noNotifications: true,
    registered: false,
    team: null,
    teamRegistering: false,
    userInvitations:  [],
    site: "open",
});

export const mutations: MutationTree<RootState> = {
    setLoggedInUser (state, user) {
        state.loggedInUser = user;
    },

    setTrue(state, target: string) {
        switch (target) {
            case 'discordReg': {
                state.discordReg = true;
                break;
            }
            case 'noNotifications': {
                state.noNotifications =  true;
                break;
            }
            case 'registered': {
                state.registered =  true;
                break;
            }
            case 'teamRegistering': {
                state.teamRegistering =  true;
                break;
            }
            default: {
                console.log('invalid state')
            }
        }
    },

    setFalse(state, target: string) {
        switch (target) {
            case 'discordReg': {
                state.discordReg = false;
                break;
            }
            case 'noNotifications': {
                state.noNotifications =  false;
                break;
            }
            case 'registered': {
                state.registered =  false;
                break;
            }
            case 'teamRegistering': {
                state.teamRegistering =  false;
                break;
            }
            default: {
                console.log('invalid state')
            }
        }
    },


    setTeam(state, team) {
        state.team = team
    },

    resetTeam(state) {
        state.team = null
    },

    resetLoggedInUser(state) {
        state.loggedInUser = null
    },

    setUserInvitations(state, invitations) {
        state.userInvitations = invitations
    },

    resetUserInvitations(state) {
        state.userInvitations = []
    },



};



let TestTeam1: TeamInfo = {
    id: 123,
    name: "test1",
    captain: 3,
    averagePp: 5,
    teamAvatarUrl: "https://a.ppy.sh/4323406?1625541513.gif",
    slug: "test",
    averageBWS: 6,
    seed: "A",
    rank: 1,
    members: [],
    scores: []
}

let testUser2: UserOpenInfo = {
    corsaceID: 3,
    discord: {
        avatar: "https://a.ppy.sh/4323406?1625541513.gif",
        userID: "4323406",
        username: "VINXIS",
    },
    osu: {
        avatar: "https://a.ppy.sh/12019633?1625400422.jpeg",
        userID: "12019633",
        username: "SteepHill",
        otherNames: [],
    },
    staff: {
        corsace: false,
        headStaff: false,
        staff: false,
    },
    openStaff: {
        isMappooler: false,
        isReferee: false,
        isScheduler: false,
    },
    joinDate: new Date(2011,10,30),
    lastLogin: new Date(2011,10,30),
    canComment: false,
    team: TestTeam1,
    pickemPoints: 1,
    rank: 1,
    badges: 1,
    pp: 14000,
}


let testBeatmap: MappoolMap = {
    mod: "NM",
    mapID: "3066907",
    name: "fuck",
    setID: "1496040",
    artist: "asdf",
    title: "asdf",
    difficulty: "test",
    time: "1:30",
    bpm: 130,
    stars: 5.6,

}
let testModgroup: ModGroup = {
    mod: "NM",
    beatmaps: [testBeatmap, testBeatmap]

}
let testMappool: MappoolInfo = {
    name: "test",
    sheet: "test",
    mappack: "test",
    modGroups: [testModgroup, testModgroup],
    length: 2
}

let TestQualifier: QualifierLobby = {
    id: 2,
    time: new Date(2020,2,11),
    teams: [TestTeam1]

}

TestTeam1.members = [testUser2,testUser2,testUser2]
TestTeam1.qualifier = TestQualifier



export const getters: GetterTree<RootState, RootState> = {
};

export const actions: ActionTree<RootState, RootState> = {
    async setLoggedInUser ({ commit }) {
        const data  = testUser2 //await this.$axios.get(`/api/user`);
        //if (!data.error) {
            commit("setLoggedInUser", data);
            if(data.team) {
                commit("setTeam", data.team)
                commit("setTrue", "registered")
            }


        //}
    },
    async setInitialData ({ dispatch }) {
        await Promise.all([
            dispatch("setLoggedInUser"),
        ]);
    },
    async refresh ({ commit, dispatch }) {
        commit("setFalse", "discordReg");
        commit("setTrue", "noNotifications");
        commit("setFalse", "registered");
        commit("setFalse", "teamRegistering");
        commit("resetTeam");
        commit("resetLoggedInUser");
        commit("resetUserInvitations");
        await dispatch("setLoggedInUser")
        await dispatch("refreshTeam")
        await dispatch("refreshPendingInvites")
    },

    async refreshTeam ({ commit, state }) {
        if(state.team) {
            const data = TestTeam1 //(await axios.get("/api/team")).data.team;
            if(data) {
                for (var i = 0; i < data.members.length; i++ ) {
                    data.members[i].pp = Math.round(data.averagePp);
                }
                data.averagePp = Math.round(data.averagePp);
                commit("setTeam", data)
            }
        }
    },

    async refreshPendingInvites  ({ commit, state }) {
        if( !state.team && state.registered && state.loggedInUser && !state.loggedInUser.staff.staff) {
            const data = (await axios.get("/api/user/pendingInvites")).data.invites;
            if(data) {
                commit("setUserInvitations", data)
                if (state.userInvitations.length !== 0) {
                    commit("setFalse", "noNotifications")
                }
            } 
        }
    }
};