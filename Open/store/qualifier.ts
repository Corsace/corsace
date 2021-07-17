import { ActionTree, MutationTree } from "vuex";
import axios from "axios"
import { Any } from "typeorm";
import { TeamInfo } from "../../Interfaces/team";
import { MappoolInfo } from "../../Interfaces/mappool";
import { ScoreInfo } from "../../Interfaces/score";
import { QualifierInfo } from "../../Interfaces/qualifier";
import { UserOpenInfo } from "../../Interfaces/user";


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
    },

    setSection (state, section) {
        state.section = section
    },

    setSubSection (state, subSection) {
        state.subSection = subSection
    },

    setScoringType (state, scoringType) {
        state.scoringType = scoringType
    }
    

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
}

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
    members: [testUser, testUser2, testUser2, testUser2, testUser2, testUser2 ,testUser2, testUser2]
}

let testteams: TeamInfo[] = [TestTeam1, TestTeam1]

let testScore: ScoreInfo = {
    qualifier: null,
    time: new Date(2021,10,30)
}

let testMappool: MappoolInfo = {
    name: "test",
    sheet: "test",
    mappack: "test",
    modGroups: null,
}

let testQualifier: QualifierInfo = {
    scores: [testScore, testScore],
    id: 1,
    time: new Date(2021,10,30),
    teams: testteams,
    public: true,
    referee: testUser2,
    mappool: testMappool,
}

export const actions: ActionTree<QualifierState, any> = {
    async refresh ({ commit, state }) {
        try { 
            const data = testQualifier //await axios.get("/api/qualifier")
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
    },

}