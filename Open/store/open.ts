import { ActionTree, MutationTree, GetterTree } from "vuex";
import { Tournament } from "../../Interfaces/tournament";

export interface OpenState {
    site: string;
    tournament: Tournament | null;
}

export const state = (): OpenState => ({
    site: "",
    tournament: null,
});

export const mutations: MutationTree<OpenState> = {
    setTournament (state, tournament) {
        state.tournament = tournament;
    },
};

export const getters: GetterTree<OpenState, OpenState> = {
};

export const actions: ActionTree<OpenState, OpenState> = {
    async setInitialData ({ commit }, year) {
        const { data } = await this.$axios.get(`/api/tournament/open/${year}`);

        if (!data.error) {
            commit("setTournament", data);
        }
    },
};