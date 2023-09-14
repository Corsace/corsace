import { ActionTree, MutationTree, GetterTree } from "vuex";
import { RootState } from "../../Assets/store/mca-ayim";
import { User, UserInfo } from "../../Interfaces/user";
import { Influence } from "../../Interfaces/influence";

export interface InfluenceState {
    users: User[];
    root: Record<string, any> | null;
}

export const state = (): InfluenceState => ({
    users: [],
    root: null,
});

export const mutations: MutationTree<InfluenceState> = {
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

export const getters: GetterTree<InfluenceState, RootState> = {

};

export const actions: ActionTree<InfluenceState, RootState> = {
    async search ({ state, commit, rootState }, value) {
        const user = state.users.find(u => u.osu.userID === value);
        if (user) {
            if (!state.root) {
                commit("setRoot", user);
            }
            return;
        }

        try {
            const { data } = await this.$axios.get<{ user: UserInfo, influences: Influence[] }>(`/api/influences?user=${value}&year=${rootState.mca?.year}&mode=${rootState.selectedMode}`);
        
            if (data.success) {
                commit("addUser", data.user);

                if (!state.root) {
                    commit("setRoot", data.user);
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
