import { ActionTree, MutationTree, GetterTree } from "vuex";
import axios from "axios"
import { TeamInfo } from "../../Interfaces/team";
import { MappoolInfo, ModGroup } from "../../Interfaces/mappool";
import { ScoreInfo } from "../../Interfaces/score";
import { QualifierInfo, QualifierLobby } from "../../Interfaces/qualifier";
import { UserOpenInfo } from "../../Interfaces/user";
import { MappoolMap } from "../../Interfaces/mappool";


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

let testUser: UserOpenInfo = {
    corsaceID: 1,
    discord: {
        avatar: "https://a.ppy.sh/4323406?1625541513.gif",
        userID: "4323406",
        username: "VINXIS",
    },
    osu: {
        avatar: "https://a.ppy.sh/4323406?1625541513.gif",
        userID: "4323406",
        username: "VINXIS",
        otherNames: [],
    },
    staff: {
        corsace: false,
        headStaff: false,
        staff: false,
    },
    joinDate: new Date(2011,10,30),
    lastLogin: new Date(2011,10,30),
    canComment: false,
    team: null,
    pickemPoints: 1,
    rank: 1,
    badges: 1,
    openStaff: {
        isMappooler: false
    }
}
let testUser2: UserOpenInfo = {
    corsaceID: 2,
    discord: {
        avatar: "https://a.ppy.sh/4323406?1625541513.gif",
        userID: "4323406",
        username: "VINXIS",
    },
    osu: {
        avatar: "https://a.ppy.sh/11489119?1622490975.jpeg",
        userID: "11489119",
        username: "crabbapples",
        otherNames: [],
    },
    staff: {
        corsace: false,
        headStaff: false,
        staff: false,
    },
    joinDate: new Date(2011,10,30),
    lastLogin: new Date(2011,10,30),
    canComment: false,
    team: null,
    pickemPoints: 1,
    rank: 1,
    badges: 1,
    openStaff: {
        isMappooler: false
    }
}


let testScore: ScoreInfo = {
    qualifier: 1,
    time: new Date(2021,10,30),
    score: 251281,
    mapID: "3066907",
    team: 123,
    user: "11489119",

}

let testScore2: ScoreInfo = {
    qualifier: 1,
    time: new Date(2021,10,30),
    score: 421421,
    mapID: "3066907",
    team: 123,
    user: "4323406",

}

let testScores: ScoreInfo[] = [testScore, testScore2]

let TestTeam1: TeamInfo = {
    id: 123,
    name: "test1",
    captain: 1,
    averagePp: 5,
    teamAvatarUrl: "https://a.ppy.sh/4323406?1625541513.gif",
    slug: "test",
    averageBWS: 6,
    seed: "A",
    rank: 1,
    members: [testUser, testUser2, testUser2, testUser2, testUser2, testUser2 ,testUser2, testUser2],
    scores: [testScore, testScore, testScore]
}

let testteams: TeamInfo[] = [TestTeam1, TestTeam1]



let testBeatmap: MappoolMap = {
    mod: "NM",
    mapID: "3066907",
    name: "fuck",
    setID: "1496040",
    artist: "asdf",
    title: "asdf",
    difficulty: "test",
    time: "1:30",
    bpm: 130,
    stars: 5.6,

}
let testModgroup: ModGroup = {
    mod: "NM",
    beatmaps: [testBeatmap, testBeatmap]

}
let testMappool: MappoolInfo = {
    name: "test",
    sheet: "test",
    mappack: "test",
    modGroups: [testModgroup, testModgroup],
    length: 2
}

let testLobby: QualifierLobby = {
    id: 5,
    time: new Date(Date.UTC(96, 1, 2, 3, 4, 5)),
    teams: testteams,
}

let testQualifier: QualifierLobby[] = [testLobby, testLobby,testLobby,testLobby,testLobby]


export const actions: ActionTree<QualifierState, QualifierState> = {

    async getList ({ commit, state }) {
        if (state.qualifiers) {
            return;
        }
        const data = testQualifier/*await axios.get("/api/qualifier")
            if (data.error) {
                alert(data.error);
                console.error(data.error);
                return;
            }*/
        commit("setQualifiers", data);
    },

    async getMappool ({ commit, state }) {
        if (state.mappool) {
            return;
        }
        const data = testMappool //await axios.get("/api/qualifier/mappool");
        /*if (data.error) {
            alert(data.error);
            console.error(data.error);
            return;
        }*/
        commit("setMappool", data);

    },

    async getScores ({ commit, state, dispatch }) {
        console.log('getScores')
        if (!state.mappool)
            await dispatch("getMappool");
        if (state.scores)
            return;
        const data = testScores//await axios.get("/api/qualifier/scores")
        /*if (data.error) {
            alert(data.error);
            console.error(data.error);
            return;
        }*/
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