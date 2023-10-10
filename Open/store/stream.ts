import { ActionTree, MutationTree, GetterTree } from "vuex";
import { MatchupScore } from "../../Interfaces/matchup";
import { OpenState } from "./open";

export interface StreamState {
    key: string | null;
    tournamentID: number | null;
    scores: MatchupScore[] | null;
}

export const state = (): StreamState => ({
    key: null,
    tournamentID: null,
    scores: null,
});

export const mutations: MutationTree<StreamState> = {
    setKey (state, data: { key: string, tournamentID?: number }) {
        state.key = data.key;
        state.tournamentID = data.tournamentID ?? null;
    },
    setScores (state, scores: MatchupScore[] | undefined) {
        state.scores = scores ?? null;
    },
};

export const getters: GetterTree<StreamState, OpenState> = {
};

export const actions: ActionTree<StreamState, OpenState> = {
    async setScores ({ commit }, stageID) {
        const state = this.state as any;
        const { data } = await this.$axios.get<{ scores: MatchupScore[] }>(`/api/${stageID}/scores?key=${state.stream.key}`);

        if (data.success)
            commit("setScores", data.scores);
    },
    async setInitialData ({ commit, dispatch }, payload: { key: string, stageID: string | (string | null)[] }) {
        if (!payload.key)
            return;

        const { data } = await this.$axios.get<{ tournamentID?: number }>(`/api/tournament/validateKey?key=${payload.key}`);

        if (!data.success)
            return;

        commit("setKey", {
            key: payload.key,
            tournamentID: data.tournamentID,
        });

        if (typeof payload.stageID === "string" && !isNaN(parseInt(payload.stageID)))
            await dispatch("setScores", parseInt(payload.stageID));
    },
};