import { ActionTree, MutationTree, GetterTree } from "vuex";
import { UserOpenInfo } from "../../Interfaces/user";
import { TeamInfo } from "../../Interfaces/team";
import { Invitation } from "../../Interfaces/invitation";
import axios from "axios";
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
        if(state.team) {
            for (var i=0; i<state.team.members.length; i++) {
                state.team.members[i].pp = Math.round(state.team.members[i].pp);
            }
            state.team.averagePp = Math.round(state.team.averagePp);
        }
        
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
        try {
            const data  = await this.$axios.get(`/api/user`);
            if (data) {
                commit("setLoggedInUser", data);
            }
        }
        catch {
            commit("setLoggedInUser", null)
        }

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
        if(state.loggedInUser && state.loggedInUser.team) {
            const data = (await axios.get("/api/team")).data.team;
            if(data) {
                commit("setTeam", data);
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