import { ActionTree, MutationTree, GetterTree } from "vuex";
import axios from "axios"
import { TeamInfo } from "../../Interfaces/team";
import { MappoolInfo, ModGroup } from "../../Interfaces/mappool";
import { ScoreInfo } from "../../Interfaces/score";
import { QualifierLobby } from "../../Interfaces/qualifier";



export interface QualifierState {
    qualifiers: QualifierLobby[]
    scores: ScoreInfo[]
    mappool: null | MappoolInfo
    teams: TeamInfo[]
}

export const mutations: MutationTree<QualifierState> = {
    setMappool (state, mappool) {
        state.mappool = mappool;
    },

    setQualifiers (state, qualifiers) {
        state.qualifiers = qualifiers;
    },

    setTeams (state, teams) {
        state.teams = teams;
    },

    pushTeam (state, team) {
        state.teams.push(team)
    },

    setScores (state, scores) {
        state.scores = scores
    }

}

export const getters: GetterTree<QualifierState, QualifierState> = {
}

export const actions: ActionTree<QualifierState, QualifierState> = {

    async getList ({ commit, state }) {
        if (state.qualifiers) {
            return;
        }
        const data = await axios.get("/api/qualifier")
            if (data.error) {
                alert(data.error);
                console.error(data.error);
                return;
            }
        commit("setQualifiers", data);
    },

    async getMappool ({ commit, state }) {
        if (state.mappool) {
            return;
        }
        const data = await axios.get("/api/qualifier/mappool");
        if (data.error) {
            alert(data.error);
            console.error(data.error);
            return;
        }
        commit("setMappool", data);

    },

    async getScores ({ commit, state, dispatch }) {
        if (!state.mappool)
            await dispatch("getMappool");
        if (state.scores)
            return;
        const data = await axios.get("/api/qualifier/scores")
        if (data.error) {
            alert(data.error);
            console.error(data.error);
            return;
        }

        commit("setScores", data);
        const nonUniqueTeams: TeamInfo[] = ([] as TeamInfo[]).concat.apply([], state.qualifiers.map(qualifier => qualifier.teams))
        const ids = {};
        commit("setTeams", []);
        for (const team of nonUniqueTeams) {
            if (ids[team.id]) 
                continue;

            ids[team.id] = true;
            commit("pushTeam", team);
        }
    },

    async publicize ({ state, dispatch }) {
        if (confirm(`Are you sure you want to ${state.qualifiers[0].public ? 'private' : 'publish'} scores?`)) {
            await axios.patch("/api/qualifier/public");
            alert("Ok done lol");
            dispatch("refresh")
        }
    },

}