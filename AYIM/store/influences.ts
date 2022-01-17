import { ActionTree, MutationTree, GetterTree } from "vuex";
import { RootState } from "../../MCA-AYIM/store/index";

export interface StaffState {
    users: any[];
    root: Record<string, any> | null;
}

export const state = (): StaffState => ({
    users: [],
    root: null,
});

export const mutations: MutationTree<StaffState> = {
    addUser (state, user) {
        state.users.push(user);
    },

    resetRoot (state) {
        state.root = null;
    },

    setRoot (state, root) {
        state.root = root;
    },
};

export const getters: GetterTree<StaffState, RootState> = {

};

export const actions: ActionTree<StaffState, RootState> = {
    async search ({ state, commit }, value) {
        const user = state.users.find(u => u.osu.userID === value);
        if (user) {
            if (!state.root) {
                commit("setRoot", user);
            }
            return;
        }

        try {
            const {data} = await this.$axios.get(`/api/influences?user=${value}`);
        
            if (!data.error) {
                commit("addUser", data);

                if (!state.root) {
                    commit("setRoot", data);
                }
            }
        } catch (error) {
            console.log(error);
        }
    },

    findUser ({ state }, userId) {
        return state.users.find(u => u.osu.userID == userId);
    },

    resetRoot ({ commit }) {
        commit("resetRoot");
    },
};
