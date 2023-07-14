import { ActionTree, MutationTree, GetterTree } from "vuex";
import { Tournament } from "../../Interfaces/tournament";
import { Team } from "../../Interfaces/team";

export interface OpenState {
    site: string;
    tournament: Tournament | null;
    team: Team | null;
}

export const state = (): OpenState => ({
    site: "",
    tournament: null,
    team: null,
});

export const mutations: MutationTree<OpenState> = {
    setTournament (state, tournament: Tournament | undefined) {
        if (tournament)
            state.tournament = {
                ...tournament,
                createdAt: new Date(tournament.createdAt),
                organizer: {
                    ...tournament.organizer,
                    joinDate: new Date(tournament.organizer.joinDate),
                    lastLogin: new Date(tournament.organizer.lastLogin),
                },
                registrations: {
                    start: new Date(tournament.registrations.start),
                    end: new Date(tournament.registrations.end),
                },
                stages: tournament.stages.map(stage => ({
                    ...stage,
                    createdAt: new Date(stage.createdAt),
                    timespan: {
                        start: new Date(stage.timespan.start),
                        end: new Date(stage.timespan.end),
                    },
                    rounds: stage.rounds.map(round => ({
                        ...round,
                        mappool: round.mappool.map(mappool => ({
                            ...mappool,
                            createdAt: new Date(mappool.createdAt),
                            mappackExpiry: mappool.mappackExpiry ? new Date(mappool.mappackExpiry) : null,
                            slots: mappool.slots.map(slot => ({
                                ...slot,
                                createdAt: new Date(slot.createdAt),
                            })),
                        })),
                    })),
                    mappool: stage.mappool?.map(mappool => ({
                        ...mappool,
                        createdAt: new Date(mappool.createdAt),
                        mappackExpiry: mappool.mappackExpiry ? new Date(mappool.mappackExpiry) : null,
                        slots: mappool.slots.map(slot => ({
                            ...slot,
                            createdAt: new Date(slot.createdAt),
                        })),
                    })),
                })),
            };
    },
    setTeam (state, teams: Team[] | undefined) {
        state.team = teams?.[0] || null;
    },
};

export const getters: GetterTree<OpenState, OpenState> = {
};

export const actions: ActionTree<OpenState, OpenState> = {
    async setTournament ({ commit }, year) {
        const { data } = await this.$axios.get(`/api/tournament/open/${year}`);

        if (!data.error) {
            commit("setTournament", data);
        }
    },
    async setTeam ({ commit }) {
        const { data } = await this.$axios.get(`/api/team`);

        if (!data.error) {
            commit("setTeam", data);
        }
    },
    async setInitialData ({ dispatch }, year) {
        await dispatch("setTournament", year);
        await dispatch("setTeam");
    },
};