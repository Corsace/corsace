import { ActionTree, MutationTree, GetterTree } from "vuex";
import { UserOpenInfo } from "../../Interfaces/user";
import { TeamInfo } from "../../Interfaces/team";
import { Invitation } from "../../Interfaces/invitation";
import axios from "axios";

interface RootState {
    loggedInUser: null | UserOpenInfo;
    discordReg: false | boolean;
    inTeam: false | boolean;
    noNotifications: true | boolean;
    registered: false | boolean; 
    team: null | TeamInfo;
    teamRegistering: false | boolean;
    userInvitations:  [] | Invitation[];
    site: "open" | string;
}

export const state = (): RootState => ({
    loggedInUser: null,
    discordReg: false,
    inTeam: false,
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
            case 'inTeam': {
                state.inTeam =  true;
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
            case 'inTeam': {
                state.inTeam =  false;
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

export const getters: GetterTree<RootState, RootState> = {
};

export const actions: ActionTree<RootState, RootState> = {
    async setLoggedInUser ({ commit }) {
        const { data } = await this.$axios.get(`/api/user`);
        if (!data.error) {
            commit("setLoggedInUser", data);
        }
    },
    async setInitialData ({ dispatch }) {
        await Promise.all([
            dispatch("setLoggedInUser"),
        ]);
    },
    async refresh ({ commit, dispatch }) {
        console.log('ran refresh')
        commit("setFalse", "discordReg");
        commit("setFalse", "inTeam");
        commit("setTrue", "noNotifications");
        commit("setFalse", "registered");
        commit("setFalse", "teamRegistering");
        commit("resetTeam");
        commit("resetLoggedInUser");
        commit("resetUserInvitations");
        await dispatch("refreshUser")
        await dispatch("refreshTeam")
        await dispatch("refreshPendingInvites")
    },

    async refreshUser ({ commit }) {
        console.log('ran refreshUser')
        const data = (await axios.get("/api/user")).data.user;
        if(data) {
            commit("setTrue", "discordReg")
            if(data.osuLinked ===  true) {
                commit("setTrue", "registered")
                data.pp = Math.round(data.pp)
            }
            commit("setUser", data)
        }
    },

    async refreshTeam ({ commit, state }) {
        console.log('ran refreshTeam')
        if(state.team) {
            const data = (await axios.get("/api/team")).data.team;
            if(data) {
                commit("setTrue", "inTeam")
                for (var i = 0; i < data.members.length; i++ ) {
                    data.members[i].pp = Math.round(data.averagePp);
                }
                data.averagePp = Math.round(data.averagePp);
                commit("setTeam", data)
            }
        }
    },

    async refreshPendingInvites  ({ commit, state }) {
        console.log('ran refreshInvites')
        if( !state.team && state.registered && state.loggedInUser && !state.loggedInUser.isStaff) {
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