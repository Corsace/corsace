import { ActionTree, MutationTree } from "vuex";
import axios from "axios"
import { Any } from "typeorm";
import { TeamInfo } from "../../Interfaces/team";
import { MappoolInfo } from "../../Interfaces/mappool";
import { ScoreInfo } from "../../Interfaces/score";
import { QualifierInfo } from "../../Interfaces/qualifier";


export interface QualifierState {
    qualifiers: QualifierInfo[] | QualifierInfo[]
    scores: ScoreInfo[] | ScoreInfo[]
    mappool: null | MappoolInfo
    teams: TeamInfo[] | TeamInfo[]
    section: "qualifiers" | string
    subSection: "teams" | string
    scoringType: "average" | string 
}

export const mutations: MutationTree<QualifierState> = {
    setMappool (state, mappool) {
        state.mappool = mappool;
    },

    setQualifiers (state, qualifiers) {
        state.qualifiers = qualifiers;
    },

    setScores (state, scores) {
        state.scores = scores;
    },

    setTeams (state, teams) {
        state.teams = teams;
    },

    pushTeam (state, team) {
        state.teams.push(team)
    }
    

}

export const actions: ActionTree<QualifierState, any> = {
    async refresh ({ commit, state }) {
        try { 
            const { data } = await axios.get("/api/qualifier")
            if (data.error)
                return alert(data.error)
            
            commit("setMappool", data.mappool)
            commit("setQualifiers", data.qualifiers)
            commit("setScores", ([] as ScoreInfo[]).concat.apply([], state.qualifiers.map((qualifier) => {
                qualifier.scores = qualifier.scores.map((score) => {
                    if (score)
                        score.qualifier = qualifier.id;
                        score.time = qualifier.time;
                    return score;
                });
                return qualifier.scores;
            })).filter(x => x != null))
            
            const nonUniqueTeams: any = ([] as TeamInfo[]).concat.apply([], state.qualifiers.map(qualifier => qualifier.teams))
            const ids = {};
            commit("setTeams", [])
            for (const team of nonUniqueTeams) {
                if (ids[team.id]) 
                    continue;

                ids[team.id] = true;
                commit("pushTeam", team);
            }
        } catch (e) {
            console.log(e);
            alert("Qualifiers are currently unavailable right now. Please try again later!");
        }
    },

    async publicize ({ state, dispatch }) {
        if (confirm(`Are you sure you want to ${state.qualifiers[0].public ? 'private' : 'publish'} scores?`)) {
            await axios.patch("/api/qualifier/public");
            alert("Ok done lol");
            dispatch("refresh")
        }
    }



}