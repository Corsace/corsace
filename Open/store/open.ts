import { ActionTree, MutationTree, GetterTree } from "vuex";
import { Tournament } from "../../Interfaces/tournament";
import { BaseTeam, Team, TeamUser } from "../../Interfaces/team";
import { BaseQualifier, QualifierScore } from "../../Interfaces/qualifier";

export interface OpenState {
    site: string;
    tournament: Tournament | null;
    team: Team | null;
    teamInvites: BaseTeam[] | null;
    qualifiers: BaseQualifier[] | null;
    qualifierScores: QualifierScore[] | null;
}

export const state = (): OpenState => ({
    site: "",
    tournament: null,
    team: null,
    teamInvites: null,
    qualifiers: null,
    qualifierScores: null,
});

export const mutations: MutationTree<OpenState> = {
    setTournament (state, tournament: Tournament | undefined) {
        if (tournament) {
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

            state.tournament.stages.sort((a, b) => a.order - b.order);
        }
    },
    async setTeam (state, teams: Team[] | undefined) {
        state.team = teams?.[0] || null;
        if (state.team?.qualifier)
            state.team.qualifier = {
                ...state.team.qualifier,
                date: new Date(state.team.qualifier.date),
            };
    },
    async setTeamInvites (state, invites: TeamUser[] | undefined) {
        if (state.team)
            state.team.invites = invites;
    },
    async setInvites (state, invites: BaseTeam[] | undefined) {
        state.teamInvites = invites || null;
    },
    async setQualifiers (state, qualifiers: BaseQualifier[] | undefined) {
        state.qualifiers = qualifiers?.map(q => ({
            ...q,
            date: new Date(q.date),
        })) || null;
    },
    async setQualifierScores (state, scores: QualifierScore[] | undefined) {
        state.qualifierScores = scores || null;
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
    async setTeam ({ commit, dispatch }) {
        const { data } = await this.$axios.get(`/api/team`);

        if (!data.error)
            commit("setTeam", data);
        
        await dispatch("setInvites");
    },
    async setTeamInvites ({ commit }) {
        const team = (this.state as any).open.team;
        if (!team)
            return;

        const { data } = await this.$axios.get(`/api/team/invite/${team.ID}`);

        if (!data.error)
            commit("setTeamInvites", data);
    },
    async setInvites ({ commit }) {
        const { data } = await this.$axios.get(`/api/team/invite/user`);

        if (!data.error)
            commit("setInvites", data);
    },
    async setQualifiers ({ commit }, tournamentID) {
        const { data } = await this.$axios.get(`/api/tournament/qualifiers/${tournamentID}`);

        if (!data.error)
            commit("setQualifiers", data);
    },
    async setQualifierScores ({ commit }, tournamentID) {
        const { data } = await this.$axios.get(`/api/tournament/qualifiers/${tournamentID}/scores`);

        if (!data.error)
            commit("setQualifierScores", data);
    },
    async setInitialData ({ dispatch }, year) {
        await Promise.all([
            dispatch("setTournament", year),
            await dispatch("setTeam"),
            await dispatch("setInvites"),
        ]);
    },
};