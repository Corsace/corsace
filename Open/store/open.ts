import { ActionTree, MutationTree, GetterTree } from "vuex";
import { Tournament } from "../../Interfaces/tournament";
import { BaseTeam, Team, TeamList, TeamUser } from "../../Interfaces/team";
import { BaseQualifier, QualifierScore } from "../../Interfaces/qualifier";

export interface OpenState {
    site: string;
    title: string;
    tournament: Tournament | null;
    teamList: TeamList[] | null;
    team: Team | null;
    teamInvites: BaseTeam[] | null;
    qualifierList: BaseQualifier[] | null;
    qualifierScores: QualifierScore[] | null;
}

export const state = (): OpenState => ({
    site: "",
    title: "",
    tournament: null,
    teamList: null,
    team: null,
    teamInvites: null,
    qualifierList: null,
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
                description: tournament.description,
            };

            state.tournament.stages.sort((a, b) => a.order - b.order);
        }
    },
    async setTeamList (state, teams: TeamList[] | undefined) {
        state.teamList = teams || null;
        if (state.teamList)
            state.teamList
                .sort((a, b) => a.BWS - b.BWS)
                .sort((a, b) => (a.BWS === 0 ? 1 : 0) - (b.BWS === 0 ? 1 : 0))
                .sort((a, b) => (a.isRegistered ? 0 : 1) - (b.isRegistered ? 0 : 1));
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
    async setQualifierList (state, qualifiers: BaseQualifier[] | undefined) {
        state.qualifierList = qualifiers?.map(q => ({
            ...q,
            date: new Date(q.date),
        })) || null;
    },
    async setQualifierScores (state, scores: QualifierScore[] | undefined) {
        state.qualifierScores = scores || null;
    },
    async setTitle (state, year: number | undefined) {
        state.title = `Corsace Open - ${year}` || "";
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
    async setTeamList ({ commit }, tournamentID) {
        const { data } = await this.$axios.get(`/api/tournament/${tournamentID}/teams`);

        if (!data.error)
            commit("setTeamList", data);
    },
    async setTeam ({ commit, dispatch }) {
        const { data } = await this.$axios.get(`/api/team`);

        if (!data.error)
            commit("setTeam", data);
        
        await dispatch("setTeamInvites");
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
    async setQualifierList ({ commit }, tournamentID) {
        const { data } = await this.$axios.get(`/api/tournament/${tournamentID}/qualifiers`);

        if (!data.error)
            commit("setQualifierList", data);
    },
    async setQualifierScores ({ commit }, tournamentID) {
        const { data } = await this.$axios.get(`/api/tournament/${tournamentID}/qualifiers/scores`);

        if (!data.error)
            commit("setQualifierScores", data);
    },
    async setInitialData ({ commit, dispatch }, year) {
        await Promise.all([
            dispatch("setTournament", year),
            commit("setTitle", year),
            await dispatch("setTeam"),
            await dispatch("setInvites"),
        ]);
    },
};