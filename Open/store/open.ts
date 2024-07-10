import { ActionTree, MutationTree, GetterTree } from "vuex";
import { Tournament } from "../../Interfaces/tournament";
import { BaseTeam, TeamList, Team, TeamInvites } from "../../Interfaces/team";
import { BaseQualifier } from "../../Interfaces/qualifier";
import { StaffList } from "../../Interfaces/staff";
import { MatchupList, MatchupScore } from "../../Interfaces/matchup";
import { Mappool } from "../../Interfaces/mappool";

export interface OpenState {
    title: string;
    tournament: Tournament | null;
    teamList: TeamList[] | null;
    myTeams: Team[] | null;
    inviteList: TeamInvites[] | null;
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
    myTeams: null,
    inviteList: null,
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
        if (!state.teamList)
            return;
        state.teamList
            .sort((a, b) => a.BWS - b.BWS)
            .sort((a, b) => (a.BWS === 0 ? 1 : 0) - (b.BWS === 0 ? 1 : 0));
    },
    addTeamList (state, team: TeamList | undefined) {
        if (!state.teamList)
            state.teamList = [];

        if (team)
            state.teamList.push(team);
    },
    setMyTeams (state, teams: Team[] | undefined) {
        state.myTeams = teams ?? null;
    },
    setTeamInvites (state, invites: TeamInvites[] | undefined) {
        state.inviteList = invites ?? null;
    },
    setInvites (state, invites: BaseTeam[] | undefined) {
        state.teamInvites = invites ?? null;
    },
    addInvite (state, invite: BaseTeam | undefined) {
        if (!state.teamInvites)
            state.teamInvites = [];

        if (invite)
            state.teamInvites.push(invite);
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
            commit("setTitle", data.tournament.year);
        }
    },
    async setTeamList ({ commit }, tournamentID) {
        const { data } = await this.$axios.get<{ teams: TeamList[] }>(`/api/tournament/${tournamentID}/teams`);

        if (data.success)
            commit("setTeamList", data.teams);
    },
    async setMyTeams ({ commit, dispatch }) {
        const { data } = await this.$axios.get<{ teams: Team[] }>(`/api/team`);

        if (data.success)
            commit("setMyTeams", data.teams);
        
        await dispatch("setTeamInvites");
    },
    async setTeamInvites ({ commit }) {
        const { data } = await this.$axios.get<{ invites: TeamInvites[] }>(`/api/team/invite/teams`);

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
    async setInitialData ({ dispatch }, year) {
        await Promise.all([
            dispatch("setTournament", year),
            dispatch("setMyTeams"),
            dispatch("setInvites"),
        ]);
    },
};