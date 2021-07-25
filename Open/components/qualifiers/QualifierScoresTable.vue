<template>
    <table class="qualifiersScoresTable">
        <tr>
            <th v-if="subSection==='players'">User</th>
            <th>Team</th>
            <th v-if="subSection==='teams'">Qual</th>
            <th>Best</th>
            <th>Worst</th>
            <th v-if="scoringType === 'costs'">Cost</th>
            <th v-else-if="scoringType === 'seeding'">Rank</th>
            <th v-else>Avg.</th>
            <th v-for="(beatmap, index) in beatmaps" :key="index" :style="beatmap.style ? beatmap.style : null"><a :href="beatmap.mapID ? `https://osu.ppy.sh/beatmaps/${beatmap.mapID}` : null">{{ beatmap.name }}</a></th>
        </tr>
        <tr v-for="(player, i) in (subSection==='players' ? userScores : teamScores)" :key="i">
            <td :style="player.style" v-if="subSection==='players'"><a :href="`https://osu.ppy.sh/u/${player.osuID}`">{{ player.username }}</a></td>
            <td :style="player.teamStyle ? player.teamStyle : null" v-if="subSection==='players'"><router-link :to="`/team/${player.teamSlug}`">{{ player.teamName }}</router-link></td>
            <td :style="player.style ? player.style : null" v-else><router-link :to="`/team/${player.slug}`">{{ player.name }}</router-link></td>
            <td v-if="subSection==='teams' && player.time"><router-link :to="`/qualifier/${player.qualifier}`">SEP {{player.time.toUTCString().split(" ")[1]}}<br>{{player.time.toUTCString().split(" ")[4].slice(0,5)}} UTC</router-link></td>
            <td v-else-if="subSection==='teams'"></td>
            <td class="qualifiersScoresBestWorst">{{ player[player.best] ? player.best.toUpperCase() : "" }}</td>
            <td class="qualifiersScoresBestWorst">{{ player[player.worst] ? player.worst.toUpperCase() : "" }}</td>
            <td class="qualifiersScoresAverage">{{ player.average && player.average !== 0 ? player.average.toLocaleString('en-US').replace(/,/gi, ' ') : "" }}{{player.average && (scoringType === 'max' || scoringType === 'avg') ? "%" : ""}}</td>
            <td class="qualifiersScoresBorder" :class="{topScore: player.nm1 && player.nm1 === topScores.nm1}">{{ player.nm1 ? player.nm1.toLocaleString('en-US').replace(/,/gi, ' ') : "" }}{{player.nm1 && (scoringType === 'max' || scoringType === 'avg') ? "%" : ""}}</td>
            <td class="qualifiersScoresBorder" :class="{topScore: player.nm2 && player.nm2 === topScores.nm2}">{{ player.nm2 ? player.nm2.toLocaleString('en-US').replace(/,/gi, ' ') : "" }}{{player.nm2 && (scoringType === 'max' || scoringType === 'avg') ? "%" : ""}}</td>
            <td class="qualifiersScoresBorder" :class="{topScore: player.nm3 && player.nm3 === topScores.nm3}">{{ player.nm3 ? player.nm3.toLocaleString('en-US').replace(/,/gi, ' ') : "" }}{{player.nm3 && (scoringType === 'max' || scoringType === 'avg') ? "%" : ""}}</td>
            <td class="qualifiersScoresBorder" :class="{topScore: player.nm4 && player.nm4 === topScores.nm4}">{{ player.nm4 ? player.nm4.toLocaleString('en-US').replace(/,/gi, ' ') : "" }}{{player.nm4 && (scoringType === 'max' || scoringType === 'avg') ? "%" : ""}}</td>
            <td class="qualifiersScoresBorder" :class="{topScore: player.hd1 && player.hd1 === topScores.hd1}">{{ player.hd1 ? player.hd1.toLocaleString('en-US').replace(/,/gi, ' ') : "" }}{{player.hd1 && (scoringType === 'max' || scoringType === 'avg') ? "%" : ""}}</td>
            <td class="qualifiersScoresBorder" :class="{topScore: player.hd2 && player.hd2 === topScores.hd2}">{{ player.hd2 ? player.hd2.toLocaleString('en-US').replace(/,/gi, ' ') : "" }}{{player.hd2 && (scoringType === 'max' || scoringType === 'avg') ? "%" : ""}}</td>
            <td class="qualifiersScoresBorder" :class="{topScore: player.hr1 && player.hr1 === topScores.hr1}">{{ player.hr1 ? player.hr1.toLocaleString('en-US').replace(/,/gi, ' ') : "" }}{{player.hr1 && (scoringType === 'max' || scoringType === 'avg') ? "%" : ""}}</td>
            <td class="qualifiersScoresBorder" :class="{topScore: player.hr2 && player.hr2 === topScores.hr2}">{{ player.hr2 ? player.hr2.toLocaleString('en-US').replace(/,/gi, ' ') : "" }}{{player.hr2 && (scoringType === 'max' || scoringType === 'avg') ? "%" : ""}}</td>
            <td class="qualifiersScoresBorder" :class="{topScore: player.dt1 && player.dt1 === topScores.dt1}">{{ player.dt1 ? player.dt1.toLocaleString('en-US').replace(/,/gi, ' ') : "" }}{{player.dt1 && (scoringType === 'max' || scoringType === 'avg') ? "%" : ""}}</td>
            <td class="qualifiersScoresBorder" :class="{topScore: player.dt2 && player.dt2 === topScores.dt2}">{{ player.dt2 ? player.dt2.toLocaleString('en-US').replace(/,/gi, ' ') : "" }}{{player.dt2 && (scoringType === 'max' || scoringType === 'avg') ? "%" : ""}}</td>
        </tr>
    </table>
</template>

<script lang='ts'>
import { Vue, Component, Prop } from "vue-property-decorator";
import { TeamInfo } from "../../../Interfaces/team";
import { UserOpenInfo } from "../../../Interfaces/user";
import { MappoolMap, MappoolInfo } from "../../../Interfaces/mappool";
import { ScoreInfo } from "../../../Interfaces/score";


const defaultMaps: MappoolMap[] = [
    {name: "NM1"},
    {name: "NM2"},
    {name: "NM3"},
    {name: "NM4"},
    {name: "HD1"},
    {name: "HD2"},
    {name: "HR1"},
    {name: "HR2"},
    {name: "DT1"},
    {name: "DT2"},
];


export interface QualifierScoreUser {
    osuID: string;
    username: string;
    teamSlug: string;
    teamName: string;
    style: Record<string, any>;
    teamStyle?: Record<string, any>;
    best: string;
    worst: string;
    average: number;
    count: number;
    qualifier?: number | null; //check this
    time?: Date;
}

export interface QualifierScoreTeam {
    name: string;
    slug: string;
    id: number;
    style?: Record<string, any>;
    members: UserOpenInfo[];
    scores: ScoreInfo[];
    best: string;
    worst: string;
    average: number;
    count: number;
    qualifier?: number | null; //check this
    time?: Date;
}

@Component
export default class QualifierScoresTable extends Vue {

    @Prop(Array) readonly scores!: ScoreInfo[]
    @Prop(Array) readonly teams!: TeamInfo[]
    @Prop(Object) readonly mappool!: MappoolInfo
    @Prop(String) readonly subSection!: string
    @Prop(String) readonly scoringType!: string


    topScores = {}
    avgScores = {}
    countScores = {}    

    
    
    get beatmaps () {
        if (!this.mappool || this.mappool.length === 0)
            return defaultMaps;
        let pool = this.mappool
        let maps = pool.modGroups.map((modGroup) => {
            return modGroup.beatmaps.map((beatmap, i) => {
                const url = `'https://assets.ppy.sh/beatmaps/${beatmap.setID}/covers/cover.jpg'`;
                beatmap.mod = modGroup.mod;
                beatmap.name = modGroup.mod + (i+1);
                beatmap.style = {
                    background: 'linear-gradient(rgba(0, 0, 0, 0.60), rgba(0, 0, 0, 0.60)), url(' + url + ')',
                }
                return beatmap;
            });
        });
        let flat: MappoolMap[] = ([] as MappoolMap[]).concat.apply([], maps);
        if (flat.length === 0)
            return defaultMaps;
        return flat;
    }

    get userScores () {
        if (!this.teams || this.teams.length === 0)
            return [];
        
        let userScores: QualifierScoreUser[] = ([] as QualifierScoreUser[]).concat.apply([], this.teams.map((team) => {
            return team.members.map((member) => {
                const url = `https://a.ppy.sh/${member.osu.userID}?${Math.random()*1000000}`;
                const userScoreInfo: QualifierScoreUser = {
                    osuID: member.osu.userID,
                    username: member.osu.username,
                    teamSlug: team.slug,
                    teamName: team.name,
                    style: {
                        background: 'linear-gradient(rgba(0, 0, 0, 0.60), rgba(0, 0, 0, 0.60)), url(' + url + ')',
                    },
                    best: "nm1",
                    worst: "nm1",
                    average: 0,
                    count: 0,
                }
                if (team.teamAvatarUrl) {
                    userScoreInfo.teamStyle = {
                        background: 'linear-gradient(rgba(0, 0, 0, 0.60), rgba(0, 0, 0, 0.60)), url(' + team.teamAvatarUrl + ')',
                    };
                }
                return userScoreInfo;
            });
        }));
        this.topScores = {};
        this.avgScores = {};
        const tempTop = {};
    
        if (this.mappool && this.scores) {
            userScores = userScores.map((user) => {
                for (const score of this.scores) {
                    if (score.user === user.osuID) {
                        user.qualifier = score.qualifier;
                        user.time = score.time;
                        const name = this.beatmaps.find((beatmap) => beatmap.mapID === score.mapID)?.name.toLowerCase();
                        if (name) {
                            user[name] = score.score;
                            user.average += score.score;
                            user.count++;
                            user.best = !user[user.best] || user[user.best] < score.score ? name : user.best;
                            user.worst = !user[user.worst] || user[user.worst] > score.score ? name : user.worst;
                            this.topScores[name] = Math.max(this.topScores[name] ? this.topScores[name] : 0, score.score);
                            if (this.avgScores[name]) {
                                this.avgScores[name] += score.score;
                                this.countScores[name]++;
                            } else {
                                this.avgScores[name] = score.score;
                                this.countScores[name] = 1;
                            }
                        }
                        
                    }
                }
                if (user.count !== 0){}
                    user.average = Math.round(user.average/user.count);

                return user;
            });
            userScores.sort((a, b) => b.average - a.average);
            switch (this.scoringType) {
                case "max":
                    userScores = userScores.map((user) => {
                        user.average = user.count = 0;
                        for (const name of Object.keys(this.topScores)) {
                            if (user[name]) {
                                user[name] = 100 * user[name] / this.topScores[name];
                                tempTop[name] = Math.max(tempTop[name] ? tempTop[name] : 0, user[name]);
                                user.average += user[name];
                                user.count++;
                            }
                        }
                        user.average /= user.count;
                        return user;
                    });
                    break;
                case "avg":
                    for (const name of Object.keys(this.avgScores))
                        this.avgScores[name] /= this.countScores[name];

                    userScores = userScores.map((user) => {
                        user.average = user.count = 0;
                        for (const name of Object.keys(this.avgScores)) {
                            if (user[name]) {
                                user[name] = 100 * user[name] / this.avgScores[name];
                                tempTop[name] = Math.max(tempTop[name] ? tempTop[name] : 0, user[name]);
                                user.average += user[name];
                                user.count++;
                            }
                        }
                        user.average /= user.count;
                        return user;
                    });
                    break;
                case "costs":
                    if (this.teamScores) {
                        userScores = userScores.map((user) => {
                            const participationBonus = 1.0 + 0.3 * (user.count / 10);
                            user.average = user.count = 0;
                            for (const name of Object.keys(this.topScores)) {
                                if (user[name]) {
                                    const team = this.teamScores.find((team) => team.members.some((member) => member.osu.userID === user.osuID));
                                    if(team)
                                        user[name] /= team[name];
                                    tempTop[name] = Math.max(tempTop[name] ? tempTop[name] : 0, user[name]);
                                    user.average += user[name];
                                    user.count++;
                                }
                            }
                            user.average /= user.count;
                            user.average = participationBonus * user.average;
                            return user;
                        });
                    }
                    break;
            }
            userScores.sort((a, b) => b.average - a.average);
            if (this.scoringType !== "sum")
                this.topScores = tempTop;
        }
        return userScores;
    }
    
    get teamScores() {
            if (!this.teams || this.teams.length === 0)
                return [];

            let teamScores = this.teams.map((team) => {
                const teamScoreInfo: QualifierScoreTeam = {
                    slug: team.slug,
                    name: team.name,
                    id: team.id,
                    members: team.members,
                    scores: [],
                    best: "nm1",
                    worst: "nm1",
                    average: 0,
                    count: 0,
                }
                if (team.teamAvatarUrl) {
                    teamScoreInfo.style = {
                        background: 'linear-gradient(rgba(0, 0, 0, 0.60), rgba(0, 0, 0, 0.60)), url(' + team.teamAvatarUrl + ')',
                        'background-position': 'bottom',
                        'background-size': 'cover',
                    }
                }
                return teamScoreInfo;
            });
            this.topScores = {};
            this.avgScores = {};
            const tempTop = {};
            if (this.mappool && this.scores) {
                teamScores = teamScores.map((team) => {
                    for (const score of this.scores) {
                        if (score.team === team.id) {
                            team.qualifier = score.qualifier;
                            team.time = score.time;
                            const name = this.beatmaps.find((beatmap) => beatmap.mapID === score.mapID)?.name.toLowerCase();
                            if(name) {
                                if (!team.scores[name])
                                    team.scores[name] = [score.score]
                                else
                                    team.scores[name].push(score.score);
                            }
                        }
                    }
                    for (const name of Object.keys(team.scores)) {
                        team[name] = team.scores[name].reduce((a, b) => a + b, 0);
                        team.average += team[name];
                        team.count++;
                        team.best = team[team.best] < team[name] ? name : team.best
                        team.worst = team[team.worst] > team[name] ? name : team.worst
                        this.topScores[name] = Math.max(this.topScores[name] ? this.topScores[name] : 0, team[name]);
                        if (this.avgScores[name]) {
                            this.avgScores[name] += team[name];
                            this.countScores[name]++;
                        } else {
                            this.avgScores[name] = team[name];
                            this.countScores[name] = 1;
                        }
                    }
                    if (team.count !== 0)
                        team.average = Math.round(team.average/team.count);
                    return team;
                });
                switch (this.scoringType) {
                    case "average":
                        teamScores.map((team) => {
                            team.average = team.count = 0;
                            for (const name of Object.keys(team.scores)) {
                                team[name] = Math.round(team[name]/team.scores[name].length);
                                tempTop[name] = Math.max(tempTop[name] ? tempTop[name] : 0, team[name]);
                                team.average += team[name];
                                team.count++;
                            };
                            team.average = Math.round(team.average/team.count);
                            return team;
                        });
                        teamScores.sort((a, b) => b.average - a.average);
                        break;
                    case "max":
                        teamScores.map((team) => {
                            team.average = team.count = 0;
                            for (const name of Object.keys(this.topScores)) {
                                if (team[name]) {
                                    team[name] = 100 * team[name] / this.topScores[name];
                                    tempTop[name] = Math.max(tempTop[name] ? tempTop[name] : 0, team[name]);
                                    team.average += team[name];
                                    team.count++;
                                }
                            }
                            team.average /= team.count;
                            return team;
                        });
                        teamScores.sort((a, b) => b.average - a.average);
                        break;
                    case "avg":
                        for (const name of Object.keys(this.avgScores)) {
                            this.avgScores[name] /= this.countScores[name];
                            teamScores.map((team) => {
                                team.average = team.count = 0;
                                if (team[name]) {
                                    team[name] = 100 * team[name] / this.avgScores[name];
                                    tempTop[name] = Math.max(tempTop[name] ? tempTop[name] : 0, team[name]);
                                    team.average += team[name];
                                    team.count++;
                                }
                                team.average /= team.count;       
                                return team;
                            });
                        }
                        teamScores.sort((a, b) => b.average - a.average);
                        break;
                    case "seeding":
                        for (const name of Object.keys(this.topScores)) {
                            this.topScores[name] = 1;
                            teamScores.sort((a, b) => b[name]-a[name]);
                            teamScores = teamScores.map((team, i) => {
                                team[name] = i+1;
                                return team;
                            });;
                        }
                        teamScores = teamScores.map((team) => {
                            let avgPlacement = 0;
                            for (const name of Object.keys(this.topScores)) {
                                avgPlacement += team[name];
                            }
                            avgPlacement /= 10;
                            team.average = avgPlacement;
                            return team;
                        });
                        teamScores.sort((a, b) => a.average - b.average);
                        teamScores = teamScores.map((team, i) => {
                            team.average = i+1;
                            return team;
                        });
                        break;
                }
            }
            if (this.scoringType !== "sum" && this.scoringType !== "seeding" && this.scoringType !== "costs")
                    this.topScores = tempTop;
            return teamScores;
    }
    
}
</script>

<style>
.qualifiersScoresTable {
    background-color: rgba(0,0,0,0.7);
    margin-top: 20px;
    border-spacing: 0;
    text-align: center;
}

.qualifiersScoresTable > tr > th, .qualifiersScoresTable > tr > td {
    padding: 20px;
}

.qualifiersScoresTable > tr > th {
    font-size: 2rem;
}

.qualifiersScoresBorder {
    border: rgba(182, 76, 76, 0.25) solid 2px;
    border-right: none;
    border-bottom: none;
    white-space: nowrap;
}

.qualifiersScoresBestWorst {
    font-weight: bold;
    font-size: 2rem;
}

.qualifiersScoresAverage {
    font-weight: bold;
    text-shadow: 0px 0px 10px white;
}

.topScore {
    color: #ffe075;
    text-shadow: 0px 0px 10px rgba(255,224,117, 0.75);
}
</style>

