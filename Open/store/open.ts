import { ActionTree, MutationTree, GetterTree } from "vuex";
import { Tournament } from "../../Interfaces/tournament";
import { BaseTeam, Team, TeamList, TeamUser } from "../../Interfaces/team";
import { BaseQualifier } from "../../Interfaces/qualifier";
import { StaffList } from "../../Interfaces/staff";
import { MatchupList, MatchupScore } from "../../Interfaces/matchup";
import { Mappool } from "../../Interfaces/mappool";

export interface OpenState {
    title: string;
    tournament: Tournament | null;
    teamList: TeamList[] | null;
    team: Team | null;
    teamInvites: BaseTeam[] | null;
    qualifierList: BaseQualifier[] | null;
    matchupList: MatchupList[] | null;
    mappools: Mappool[] | null;
    scores: MatchupScore[] | null;
    staffList: StaffList[] | null;
}

export const state = (): OpenState => ({
    title: "",
    tournament: null,
    teamList: null,
    team: null,
    teamInvites: null,
    qualifierList: null,
    matchupList: null,
    mappools: null,
    scores: null,
    staffList: null,
});

export const mutations: MutationTree<OpenState> = {
    setTitle (state, year: number | undefined) {
        state.title = `Corsace Open - ${year}` || "";
    },
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
                        mappool: round.mappool?.map(mappool => ({
                            ...mappool,
                            createdAt: new Date(mappool.createdAt),
                            mappackExpiry: mappool.mappackExpiry ? new Date(mappool.mappackExpiry) : null,
                            slots: mappool.slots.map(slot => ({
                                ...slot,
                                createdAt: new Date(slot.createdAt),
                            })),
                        })) || [],
                    })),
                    mappool: stage.mappool?.map(mappool => ({
                        ...mappool,
                        createdAt: new Date(mappool.createdAt),
                        mappackExpiry: mappool.mappackExpiry ? new Date(mappool.mappackExpiry) : null,
                        slots: mappool.slots.map(slot => ({
                            ...slot,
                            createdAt: new Date(slot.createdAt),
                        })),
                    })) || [],
                })),
            };

            state.tournament.stages.sort((a, b) => a.order - b.order);
        }
    },
    setTeamList (state, teams: TeamList[] | undefined) {
        state.teamList = teams ?? null;
        if (state.teamList) {
            const unregisteredTeams = state.teamList.filter(team => !team.isRegistered);
            unregisteredTeams
                .sort((a, b) => a.BWS - b.BWS)
                .sort((a, b) => (a.BWS === 0 ? 1 : 0) - (b.BWS === 0 ? 1 : 0))
                .sort((a, b) => b.members.length - a.members.length);
            const registeredTeams = state.teamList.filter(team => team.isRegistered);
            registeredTeams
                .sort((a, b) => a.BWS - b.BWS)
                .sort((a, b) => (a.BWS === 0 ? 1 : 0) - (b.BWS === 0 ? 1 : 0));
            state.teamList = [...registeredTeams, ...unregisteredTeams];
        }
    },
    setTeam (state, teams: Team[] | undefined) {
        teams = teams?.filter(team => !team.tournaments || !team.tournaments.some(tournament => tournament.ID !== state.tournament?.ID)); // TODO: Remove this when the website supports multiple teams for a user

        state.team = teams?.[0] ?? null;
        if (state.team?.qualifier)
            state.team.qualifier = {
                ...state.team.qualifier,
                date: new Date(state.team.qualifier.date),
            };
    },
    setTeamInvites (state, invites: TeamUser[] | undefined) {
        if (state.team)
            state.team.invites = invites;
    },
    setInvites (state, invites: BaseTeam[] | undefined) {
        state.teamInvites = invites ?? null;
    },
    setQualifierList (state, qualifiers: BaseQualifier[] | undefined) {
        state.qualifierList = qualifiers?.map(q => ({
            ...q,
            date: new Date(q.date),
        })) ?? null;
    },
    setMatchups (state, matchups: MatchupList[] | undefined) {
        state.matchupList = matchups?.map(matchup => {
            matchup.date = new Date(matchup.date);
            return matchup;
        }) ?? [];
        state.matchupList.sort((a, b) => a.date.getTime() - b.date.getTime());
    },
    setMappools (state, mappools: Mappool[] | undefined) {
        state.mappools = mappools?.map(mappool => ({
            ...mappool,
            createdAt: new Date(mappool.createdAt),
            mappackExpiry: mappool.mappackExpiry ? new Date(mappool.mappackExpiry) : null,
            slots: mappool.slots.map(slot => ({
                ...slot,
                createdAt: new Date(slot.createdAt),
            })),
        })) ?? [];
    },
    setScores (state, scores: MatchupScore[] | undefined) {
        state.scores = scores ?? null;
    },
    setStaffList (state, staff: StaffList[] | undefined) {
        state.staffList = staff ?? null;
    },
};

export const getters: GetterTree<OpenState, OpenState> = {
};

export const actions: ActionTree<OpenState, OpenState> = {
    async setTournament ({ commit }, year) {
        const { data } = await this.$axios.get<{ tournament: Tournament }>(`/api/tournament/open/${year}`);

        if (data.success) {
            commit("setTournament", data.tournament);
        }
    },
    async setTeamList ({ commit }, tournamentID) {
        const { data } = await this.$axios.get<{ teams: Team[] }>(`/api/tournament/${tournamentID}/teams`);

        if (data.success)
            commit("setTeamList", data.teams);
    },
    async setTeam ({ commit, dispatch }) {
        const { data } = await this.$axios.get<{ teams: Team[] }>(`/api/team`);

        if (data.success)
            commit("setTeam", data.teams);
        
        await dispatch("setTeamInvites");
    },
    async setTeamInvites ({ commit }) {
        const team = (this.state as any).open.team;
        if (!team)
            return;

        const { data } = await this.$axios.get<{ invites: TeamUser[] }>(`/api/team/invite/${team.ID}`);

        if (data.success)
            commit("setTeamInvites", data.invites);
    },
    async setInvites ({ commit }) {
        const { data } = await this.$axios.get<{ invites: BaseTeam[] }>(`/api/team/invite/user`);

        if (data.success)
            commit("setInvites", data.invites);
    },
    async setQualifierList ({ commit }, tournamentID) {
        const { data } = await this.$axios.get<{ qualifiers: BaseQualifier[] }>(`/api/tournament/${tournamentID}/qualifiers`);

        if (data.success)
            commit("setQualifierList", data.qualifiers);
    },
    async setMatchups ({ commit }, stageID) {
        if (!stageID || isNaN(parseInt(stageID)))
            return;

        const { data } = await this.$axios.get<{ matchups: MatchupList[] }>(`/api/stage/${stageID}/matchups`);

        if (data.success)
            commit("setMatchups", data.matchups);
    },
    async setMappools ({ commit }, stageID) {
        if (!stageID || isNaN(parseInt(stageID)))
            return;

        const { data } = await this.$axios.get<{ mappools: Mappool[] }>(`/api/stage/${stageID}/mappools`);

        if (data.success)
            commit("setMappools", data.mappools);
    },
    async setScores ({ commit }, stageID) {
        if (!stageID || isNaN(parseInt(stageID)))
            return;

        const { data } = await this.$axios.get<{ scores: MatchupScore[] }>(`/api/stage/${stageID}/scores`);

        if (data.success)
            commit("setScores", data.scores);
    },
    async setStaffList ({ commit }, tournamentID) {
        const { data } = await this.$axios.get<{ staff: StaffList[] }>(`/api/tournament/${tournamentID}/staff`);

        if (data.success)
            commit("setStaffList", data.staff);
    },
    async setInitialData ({ commit, dispatch }, year) {
        await Promise.all([
            dispatch("setTournament", year),
            commit("setTitle", year),
            dispatch("setTeam"),
            dispatch("setInvites"),
        ]);
    },
};