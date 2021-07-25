<template>
    <div>
        <div class="referee" v-if="!loading">
            <div class="refereeStageSelection">
                ROUND
                <div class="refereeStage" v-for="(stage, i) in stages" :key="i" :class="{refereeActive: stage === selectedStage}" @click="toggleStage(stage)">
                    {{stage}}
                </div>
            </div>
            <div class="refereeMatchSelection">
                MATCH
                <div class="refereeMatches" v-for="(match, i) in matches" :key="i" :class="{refereeActive: !selectedMatch ? false : selectedStage === 'QUALIFIERS' ? selectedMatch.id === match.id : selectedMatch.matchID === match.matchID}">
                    <div class="refereeMatch" v-if="selectedStage === 'QUALIFIERS'" @click="toggleMatch(match)">
                        <div class="refereeMatchTime">
                            {{match.time.toUTCString().split(" ")[2] + " " + match.time.toUTCString().split(" ")[1]}}
                            <br>
                            {{match.time.toUTCString().split(" ")[4].slice(0,5)}}
                        </div>
                        <div v-if="selectedStage === 'QUALIFIERS' ? matchloader === match.id : matchloader === match.matchID" style="position: relative; left: -10%;">
                            <loading></loading>
                        </div>
                        <div v-else-if="match.mp">
                            <img src="../../Assets/img/open/captain.png">
                        </div>
                        <div class="trashCan">
                            <img @click="remove(match)" src="../../Assets/img/open/delete.png">
                        </div>
                    </div>
                    <div class="refereeMatch" v-else @click="toggleMatch(match)">
                        {{match.matchID}}
                        <div class="refereeMatchTime">
                            {{match.time.toUTCString().split(" ")[2] + " " + match.time.toUTCString().split(" ")[1]}}
                            <br>
                            {{match.time.toUTCString().split(" ")[4].slice(0,5)}}
                        </div>
                        <div v-if="match.mp">
                            <img src="../../Assets/img/open/captain.png">
                        </div>
                        <div class="trashCan">
                            <img @click="remove(match)" src="../../Assets/img/open/delete.png">
                        </div>
                    </div>
                </div>
            </div>
            <div class="refereeCommandsSection">
                COMMANDS
                <div class="refereeSubHeader" v-if="selectedMatch">
                    Click the command below to copy the invite command to your clipboard
                </div>
                <div v-if="selectedMatch">
                    <div class="refereeCommandsSubsection">
                        Before match
                        <div class="refereeCommands">
                            <div class="refereeCommand" @click="clipboard(`!mp make CO: (${selectedStage === 'QUALIFIERS' ? 'Qualifiers' : selectedMatch.teamA ? selectedMatch.teamA.name : ''}) vs (${selectedStage === 'QUALIFIERS' ? selectedMatch.time.toUTCString().split(' ')[2] + '/' + selectedMatch.time.toUTCString().split(' ')[1] + ' ' + selectedMatch.time.toUTCString().split(' ')[4].slice(0,5) : selectedMatch.teamB ? selectedMatch.teamB.name : ''})`)">
                                !mp make CO: ({{selectedStage === 'QUALIFIERS' ? 'Qualifiers' : selectedMatch.teamA ? selectedMatch.teamA.name : ''}}) vs ({{selectedStage === 'QUALIFIERS' ? selectedMatch.time.toUTCString().split(" ")[2] + '/' + selectedMatch.time.toUTCString().split(" ")[1] + ' ' + selectedMatch.time.toUTCString().split(" ")[4].slice(0,5) : selectedMatch.teamB ? selectedMatch.teamB.name : ''}})
                            </div>
                            <div class="refereeCommand" @click="clipboard(`!mp set ${selectedStage === 'QUALIFIERS' ? 0 : 2} 3 ${selectedStage === 'QUALIFIERS' ? 16 : 9}`)">!mp set {{selectedStage === 'QUALIFIERS' ? 0 : 2}} 3 {{selectedStage === 'QUALIFIERS' ? 16 : 9}}</div>
                            <div class="refereeCommand" @click="clipboard('!mp settings')">!mp settings</div>
                            <div class="refereeCommand" v-if="selectedMatch.streamer" @click="clipboard(`!mp addref ${selectedMatch.streamer.username}`)">!mp addref {{selectedMatch.streamer.username}}</div>
                            <div class="refereeCommand" v-if="selectedMatch.commentators" v-for="(comm, i) in selectedMatch.commentators" :key="i" @click="clipboard(`!mp addref ${comm.username}`)">!mp addref {{comm.username}}</div>
                            <div class="refereeCommand" v-if="selectedStage !== 'QUALIFIERS'" @click="clipboard('!mp move')">!mp move</div>
                            <div class="refereeCommand" v-if="selectedStage !== 'QUALIFIERS'" @click="clipboard('!mp team')">!mp team</div>
                        </div>
                    </div>
                    <div class="refereeCommandsSubsection">
                        During match
                        <div class="refereeCommands" v-if="mappool && mappool.modGroups">
                            <div class="refereeBeatmap refereeCommand" @click="clipboard('!mp timer 90')">
                                <div>!mp timer 90</div>
                                <div>For bans/picks</div>
                            </div>
                            <div class="refereeBeatmap refereeCommand" @click="clipboard('!mp start 90')">
                                <div>!mp start 90</div>
                                <div>For readying</div>
                            </div>
                            <div v-for="(modGroup, i) in mappool.modGroups" :key="i">
                                <div v-if="modGroup.beatmaps" :class="modGroup.mod">
                                    <div class="refereeModGroupHeader refereeCommand" @click="clipboard(`!mp mods ${modGroup.mod === 'FM' || modGroup.mod === 'TB' ? 'freemod' : modGroup.mod === 'NM' ? 'NF' : 'NF ' + modGroup.mod}`)">
                                        <div>{{modGroup.mod}}</div>
                                        <div>!mp mods {{modGroup.mod === 'FM' || modGroup.mod === 'TB' ? 'freemod' : modGroup.mod === 'NM' ? 'NF' : 'NF ' + modGroup.mod}}</div>
                                    </div>
                                    <div class="refereeBeatmap refereeCommand" v-for="(beatmap, j) in modGroup.beatmaps" :key="j" :class="{bannedMap: bannedMaps.some(map => map.mapID === beatmap.mapID)}"  @click="bannedMaps.some(map => map.mapID === beatmap.mapID) ? 0 : clipboard(`!mp map ${beatmap.mapID}`)">
                                        <div style="flex: 1;">
                                            {{j+1}}
                                        </div>
                                        <div style="flex: 5; text-align: left;">
                                            {{beatmap.artist}}<br>{{beatmap.title}}
                                        </div>
                                        <div style="flex: 5; text-align: end;">
                                            !mp map {{beatmap.mapID}}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-if="selectedStage !== 'QUALIFIERS'" class="refereeBeatmap refereeCommand" @click="clipboard('!mp timer 150')">
                                <div>!mp timer 150</div>
                                <div>Opt. prep time before first map of set</div>
                            </div>
                            <div v-if="selectedStage !== 'QUALIFIERS'" class="refereeBeatmap refereeCommand" @click="clipboard('!mp timer 600')">
                                <div>!mp timer 600</div>
                                <div>10 min. break before next set</div>
                            </div>
                        </div>
                    </div>
                    <div class="refereeCommandsSubsection">
                        After match
                        <div class="refereeCommands">
                            <div class="refereeCommand" @click="clipboard(`!mp close`)">!mp close</div>
                            <input class="refereeLinkInput" :placeholder="mp === '' ? 'paste osu!mp url here' : 'https://osu.ppy.sh/community/matches/' + mp.toString()" v-model="mp" @input="addMP">
                        </div>
                    </div>
                </div>
            </div>
            <div class="refereeTeams" v-if="selectedStage === 'QUALIFIERS'">
                TEAMS
                <div class="refereeSubHeader" v-if="selectedMatch">
                    Click the player below to copy the invite command to your clipboard
                </div>
                <div v-if="selectedMatch">
                    <div class="refereeTeam" v-for="(team, i) in selectedMatch.teams" :key="i">
                        {{team.name}}
                        <div class="refereeMembers" v-for="(member, j) in team.members" :key="j" @click="clipboard(`!mp invite #${member.osu.userID}`)">
                            {{member.osu.username}} ({{member.osu.userID}}) #{{member.rank}}
                            <img v-if="member.corsaceID.toString() === team.captain" src="../../Assets/img/open/captain.png">
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="refereeMatchSection">
                <div class="refereeTeams">
                    TEAMS
                    <div class="refereeSubHeader" v-if="selectedMatch">
                        Click the player below to copy the invite command to your clipboard
                    </div>
                    <div class="refereeChoiceSection">
                        <div class="refereeTeam" v-if="selectedMatch && selectedMatch.teamA">
                            {{selectedMatch.teamA.name}}
                            <div class="refereeMembers" v-for="(member, j) in selectedMatch.teamA.members" :key="j" @click="clipboard(`!mp invite #${member.osuID}`)">
                                {{member.osu.username}} ({{member.osu.userID}}) #{{member.rank}}
                                <img v-if="member.corsaceID.toString() === selectedMatch.teamA.captain" src="../../Assets/img/open/captain.png">
                            </div>
                        </div>
                        <div class="refereeTeam" v-if="selectedMatch && selectedMatch.teamB">
                            {{selectedMatch.teamB.name}}
                            <div class="refereeMembers" v-for="(member, j) in selectedMatch.teamB.members" :key="j" @click="clipboard(`!mp invite #${member.osu.userID}`)">
                                {{member.osu.username}} ({{member.osu.userID}}) #{{member.rank}}
                                <img v-if="member.corsaceID.toString() === selectedMatch.teamB.captain" src="../../Assets/img/open/captain.png">
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="selectedMatch && selectedStage !== 'QUALIFIERS'" class="refereeFormatSection refereeCommands">
                    <div class="refereeBeatmap refereeCommand">
                        First ban for set 1 is by
                        <span v-if="selectedMatch.teamA" :class="{refereeFirst: selectedMatch.first && selectedMatch.first.id === selectedMatch.teamA.id, refereeSecond: !(selectedMatch.first && selectedMatch.first.id === selectedMatch.teamA.id)}" @click="first(selectedMatch.teamA.name)">{{selectedMatch.teamA.name}}</span>
                        <span v-if="selectedMatch.teamB" :class="{refereeFirst: selectedMatch.first && selectedMatch.first.id === selectedMatch.teamB.id, refereeSecond: !(selectedMatch.first && selectedMatch.first.id === selectedMatch.teamB.id)}" @click="first(selectedMatch.teamB.name)">{{selectedMatch.teamB.name}}</span>
                    </div>
                    <div style="text-align:center;font-weight:bold;">
                        Click the currently playing set below:
                    </div>
                    <div class="refereeBeatmap refereeCommand" style="color:#b64c4c;font-size: 24px;">
                        <span @click="set=i" v-for="i in selectedMatch.bestOf" :key="i" :class="{refereeSetSelected: set === i}">Set {{i}}</span>
                    </div>
                    <div v-if="selectedMatch.first">
                        <div class="refereePickBanFormat refereeCommand" v-for="index in selectedMatch.bestOf" :key="index">
                            <div class="refereeSetName">
                                Set {{index}}
                            </div>
                            <div class="refereePickBanTeam">
                                {{ index%2 === 1 ? selectedMatch.first.name : selectedMatch.first.id === selectedMatch.teamA.id ? selectedMatch.teamB.name : selectedMatch.teamA.name }}
                                <select class="ban" v-model="selectedMaps[index-1][0]" @change="map(index-1, 0, 'BANNED')">
                                    <option v-if="selectedMaps[index-1][0]" :value="selectedMaps[index-1][0]">{{selectedMaps[index-1][0].name}}</option>
                                    <option v-for="(map, index) in remainingMaps" :key="index" :value="map">{{map.name}}</option>
                                </select>
                                <div class="empty"></div>
                                <select class="pick" v-model="selectedMaps[index-1][2]" @change="map(index-1, 2, 'PICKED')">
                                    <option v-if="selectedMaps[index-1][2]" :value="selectedMaps[index-1][2]">{{selectedMaps[index-1][2].name}}</option>
                                    <option v-for="(map, index) in remainingMaps" :key="index" :value="map">{{map.name}}</option>
                                </select>
                                <div class="empty"></div>
                                <div class="empty"></div>
                                <select class="ban" v-model="selectedMaps[index-1][5]" @change="map(index-1, 5, 'BANNED')">
                                    <option v-if="selectedMaps[index-1][5]" :value="selectedMaps[index-1][5]">{{selectedMaps[index-1][5].name}}</option>
                                    <option v-for="(map, index) in remainingMaps" :key="index" :value="map">{{map.name}}</option>
                                </select>
                                <div class="empty"></div>
                                <select class="pick" v-model="selectedMaps[index-1][7]" @change="map(index-1, 7, 'PICKED')">
                                    <option v-if="selectedMaps[index-1][7]" :value="selectedMaps[index-1][7]">{{selectedMaps[index-1][7].name}}</option>
                                    <option v-for="(map, index) in remainingMaps" :key="index" :value="map">{{map.name}}</option>
                                </select>
                                <select class="pick" v-model="selectedMaps[index-1][8]" @change="map(index-1, 8, 'PICKED')">
                                    <option v-if="selectedMaps[index-1][8]" :value="selectedMaps[index-1][8]">{{selectedMaps[index-1][8].name}}</option>
                                    <option v-for="(map, index) in remainingMaps" :key="index" :value="map">{{map.name}}</option>
                                </select>
                                <div class="empty"></div>
                                <span class="matchBan" v-if="index < selectedMatch.bestOf-1">MATCH BAN</span>
                                <select class="ban" v-if="index < selectedMatch.bestOf-1" @change="map(index-1, -2, 'BANNED')" v-model="matchBans[2*index-2]">
                                    <option v-if="selectedMaps[index-1][0]" :value="selectedMaps[index-1][0]">{{selectedMaps[index-1][0].name}}</option>
                                    <option v-if="selectedMaps[index-1][5]" :value="selectedMaps[index-1][5]">{{selectedMaps[index-1][5].name}}</option>
                                </select>
                                <div class="empty"></div>
                            </div>
                            <div class="refereePickBanTeam"> 
                                {{ index%2 === 1 ? selectedMatch.first.id === selectedMatch.teamA.id ? selectedMatch.teamB.name : selectedMatch.teamA.name : selectedMatch.first.name }}
                                <div class="empty"></div>
                                <select class="ban" v-model="selectedMaps[index-1][1]" @change="map(index-1, 1, 'BANNED')">
                                    <option v-if="selectedMaps[index-1][1]" :value="selectedMaps[index-1][1]">{{selectedMaps[index-1][1].name}}</option>
                                    <option v-for="(map, index) in remainingMaps" :key="index" :value="map">{{map.name}}</option>
                                </select>
                                <div class="empty"></div>
                                <select class="pick" v-model="selectedMaps[index-1][3]" @change="map(index-1, 3, 'PICKED')">
                                    <option v-if="selectedMaps[index-1][3]" :value="selectedMaps[index-1][3]">{{selectedMaps[index-1][3].name}}</option>
                                    <option v-for="(map, index) in remainingMaps" :key="index" :value="map">{{map.name}}</option>
                                </select>
                                <select class="ban" v-model="selectedMaps[index-1][4]" @change="map(index-1, 4, 'BANNED')">
                                    <option v-if="selectedMaps[index-1][4]" :value="selectedMaps[index-1][4]">{{selectedMaps[index-1][4].name}}</option>
                                    <option v-for="(map, index) in remainingMaps" :key="index" :value="map">{{map.name}}</option>
                                </select>
                                <div class="empty"></div>
                                <select class="pick" v-model="selectedMaps[index-1][6]" @change="map(index-1, 6, 'PICKED')">
                                    <option v-if="selectedMaps[index-1][6]" :value="selectedMaps[index-1][6]">{{selectedMaps[index-1][6].name}}</option>
                                    <option v-for="(map, index) in remainingMaps" :key="index" :value="map">{{map.name}}</option>
                                </select>
                                <div class="empty"></div>
                                <div class="empty"></div>
                                <select class="pick" v-model="selectedMaps[index-1][9]" @change="map(index-1, 9, 'PICKED')">
                                    <option v-if="selectedMaps[index-1][9]" :value="selectedMaps[index-1][9]">{{selectedMaps[index-1][9].name}}</option>
                                    <option v-for="(map, index) in remainingMaps" :key="index" :value="map">{{map.name}}</option>
                                </select>
                                <div class="empty"></div>
                                <span class="matchBan" v-if="index < selectedMatch.bestOf-1">MATCH BAN</span>
                                <select class="ban" v-if="index < selectedMatch.bestOf-1" @change="map(index-1, -1, 'BANNED')" v-model="matchBans[2*index-1]">
                                    <option v-if="selectedMaps[index-1][1]" :value="selectedMaps[index-1][1]">{{selectedMaps[index-1][1].name}}</option>
                                    <option v-if="selectedMaps[index-1][4]" :value="selectedMaps[index-1][4]">{{selectedMaps[index-1][4].name}}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else>
            <loading></loading>
        </div>
        <transition name="fade">
            <popup v-if="showPopup" :text="popupText"/>
        </transition>
    </div>
</template>

<script lang='ts'>
import axios from 'axios';
import Loading from "../components/Loading.vue";
import Popup from "../components/Popup.vue";
import { Component, Vue } from "vue-property-decorator"
import { State } from "vuex-class"
import { UserOpenInfo } from '../../Interfaces/user';
import { MappoolInfo, ModGroup } from '../../Interfaces/mappool';
import { MatchInfo, MatchMap, MatchSet } from '../../Interfaces/match';
import { MappoolMap } from '../../Interfaces/mappool';
import { TeamInfo } from '../../Interfaces/team';


@Component({
    name: 'referee',
    components: {
        Loading,
        Popup,
    }
})
export default class Referee extends Vue {


    


testUser2: UserOpenInfo = {
    corsaceID: 3,
    discord: {
        avatar: "https://a.ppy.sh/4323406?1625541513.gif",
        userID: "4323406",
        username: "VINXIS",
    },
    osu: {
        avatar: "https://a.ppy.sh/12019633?1625400422.jpeg",
        userID: "12019633",
        username: "SteepHill",
        otherNames: [],
    },
    staff: {
        corsace: true,
        headStaff: true,
        staff: true,
    },
    openStaff: {
        isMappooler: true,
        isReferee: true,
        isScheduler: true,
    },
    joinDate: new Date(2011,10,30),
    lastLogin: new Date(2011,10,30),
    canComment: false,
    team: null,
    pickemPoints: 1,
    rank: 1,
    badges: 1,
    pp: 14000,
}

TestTeam1: TeamInfo = {
    id: 123,
    name: "test1",
    captain: 3,
    averagePp: 5,
    teamAvatarUrl: "https://a.ppy.sh/4323406?1625541513.gif",
    slug: "test",
    averageBWS: 6,
    seed: "A",
    rank: 1,
    members: [this.testUser2, this.testUser2],

    
}

TestTeam2: TeamInfo = {
    id: 124,
    name: "test2",
    captain: 3,
    averagePp: 5,
    teamAvatarUrl: "https://a.ppy.sh/4323406?1625541513.gif",
    slug: "test",
    averageBWS: 6,
    seed: "A",
    rank: 1,
    members: [this.testUser2, this.testUser2],

    
}

    testBeatmap: MappoolMap = {
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

testBeatmap2: MappoolMap = {
    mod: "HD",
    mapID: "2787950",
    name: "fuck",
    setID: "1346246",
    artist: "asdf",
    title: "asdf",
    difficulty: "test",
    time: "1:30",
    bpm: 130,
    stars: 5.6,

}

testBeatmap3: MappoolMap = {
    mod: "HD",
    mapID: "2944289",
    name: "fuck",
    setID: "1430235",
    artist: "asdf",
    title: "asdf",
    difficulty: "test",
    time: "1:30",
    bpm: 130,
    stars: 5.6,

}

testBeatmap4: MappoolMap = {
    mod: "NM",
    mapID: "2900406",
    name: "fuck",
    setID: "1401591",
    artist: "asdf",
    title: "asdf",
    difficulty: "test",
    time: "1:30",
    bpm: 130,
    stars: 5.6,

}

testModgroup: ModGroup = {
    mod: "NM",
    beatmaps: [this.testBeatmap, this.testBeatmap4]

}

testModgroup2: ModGroup = {
    mod: "HD",
    beatmaps: [this.testBeatmap2, this.testBeatmap3]

}
testMappool: MappoolInfo = {
    name: "test",
    sheet: "test",
    mappack: "test",
    modGroups: [this.testModgroup, this.testModgroup2],
    length: 2,
    slug: 'quarter-finals'
}


testMap1: MatchMap = {
    map: this.testBeatmap,
    mapMod: "NM",
    mapPosition: 0

}

testMap2: MatchMap = {
    map: this.testBeatmap2,
    mapMod: "HD",
    mapPosition: 0

}
testMap3: MatchMap = {
    map: this.testBeatmap3,
    mapMod: "HD",
    mapPosition: 1

}
testMatchSet: MatchSet = {
    bans: [],//[this.testMap1],
    picks: []//[this.testMap2]
}

testMatch: MatchInfo = {
    bestOf: 3,
    matchID: "1249012",
    id: "125125",
    sets: [this.testMatchSet, this.testMatchSet],
    bans: [],//[this.testMap3],
    time: new Date(2020,2,11),
    teamA: this.TestTeam1,
    teamB: this.TestTeam2,
    first: this.TestTeam1,
}

testMatches: MatchInfo[] = [this.testMatch, this.testMatch]








    @State loggedInUser!: UserOpenInfo
    stages = ["QUALIFIERS", "ROUND OF 32", "ROUND OF 16", "QUARTER FINALS", "SEMI FINALS", "FINALS", "GRAND FINALS"]
    selectedStage = ""
    selectedMatch: MatchInfo | null = null
    selectedMaps: MappoolMap[][] = []
    matchBans: MappoolMap[] = [] 
    month = {
        '08': 'AUG',
        '09': 'SEP',
        '10': 'OCT',
    }
    order = {
        "-2": -1,
        "-1": -1,
        0: 0,
        1: 1,
        2: 0,
        3: 1,
        4: 2,
        5: 3,
        6: 2,
        7: 3,
        8: 4,
        9: 5,
    }
    matches: MatchInfo[] = []
    teams: TeamInfo[] = []
    mappool: MappoolInfo | null = null
    loading = true
    popupText = ""
    showPopup = false
    matchloader = ""
    mp = ""
    set = 1
    regex = /^https:\/\/osu\.ppy\.sh\/(mp|community\/matches)\/(\d+)/

    async mounted () {
        this.loading = true;
        try {
            //await axios.get("api/referee")
            this.loading = false;
        } catch (e) {
            if (e) return //this.$router.push({ path: '/404' });
        }
    }
    
    get bannedMaps () {
        if (this.selectedMatch && this.set === this.selectedMatch.bestOf)
            return [];
        if (this.selectedMatch && this.selectedMatch.sets[this.set-1])
            return this.selectedMatch.bans.concat(this.selectedMatch.sets[this.set-1].bans).map((beatmap) => beatmap.map);
        return this.selectedMatch?.bans.map((beatmap) => beatmap.map);
    }

    get remainingMaps () {
        console.log('???')
        if(this.mappool) {
            let poolMaps: MappoolMap[] = ([] as MappoolMap[]).concat.apply([], this.mappool.modGroups.map(modGroup => modGroup.beatmaps));
            if (this.bannedMaps)
                poolMaps = poolMaps.filter((map) => !this.bannedMaps?.some((banned) => banned.mapID === map.mapID));
            if (this.selectedMatch && this.selectedMatch.sets[this.set-1] && this.selectedMatch.sets[this.set-1].picks)
                poolMaps = poolMaps.filter((map) => !this.selectedMatch?.sets[this.set-1].picks.some((picked) => picked.map.mapID === map.mapID));
            return poolMaps;
        }
        console.log('!!!')
    }

    async toggleStage (stage) {
        if (this.selectedStage === stage)
            return;

        try {
            //const data = (await axios.get(`/api/referee/${stage}`)).data;
            this.matches = this.testMatches//data.matches;
            this.mappool = this.testMappool//data.mappool;
            if(this.mappool) {
                this.mappool.modGroups = this.mappool.modGroups.map((modGroup) => {
                modGroup.beatmaps = modGroup.beatmaps.map((map, i) => {
                    map.name = modGroup.mod + (i + 1)
                    return map;
                });
                return modGroup;
            });
            }
            this.selectedStage = stage;
            this.selectedMatch = null;
            this.mp = "";
        } catch (e) {
            if (e) alert(e);
        }
    }
    toggleMatch (match) {
        this.selectedMatch = match;
        this.mp = this.selectedMatch?.mp ? "https://osu.ppy.sh/community/matches/" + this.selectedMatch.mp : "";
        this.addSelected();
        
    }
    addSelected () {
        this.selectedMaps = [];
        if(this.selectedMatch) {
            this.matchBans = this.selectedMatch.bans.map(ban => {
                const map = ban.map;
                map.name = ban.mapMod + (ban.mapPosition + 1);
                return map;
            });
        }
        
        if(this.selectedMatch) {
            for (let i = 0; i < this.selectedMatch.bestOf; i++) {
            let arr: MatchMap[] = [];
            if (this.selectedMatch.sets[i]) {
                if (this.selectedMatch.sets[i].bans.length < 3)
                    arr = this.selectedMatch.sets[i].bans.concat(this.selectedMatch.sets[i].picks);
                else {
                    arr = [this.selectedMatch.sets[i].bans[0], this.selectedMatch.sets[i].bans[1]];
                    if (this.selectedMatch.sets[i].picks.length < 3)
                        arr = arr.concat(this.selectedMatch.sets[i].picks);
                    else
                        arr = [...arr, this.selectedMatch.sets[i].picks[0], this.selectedMatch.sets[i].picks[1]];
                    for (let j = 2; j < this.selectedMatch.sets[i].bans.length; j++)
                        arr.push(this.selectedMatch.sets[i].bans[j])
                    for (let j = 2; j < this.selectedMatch.sets[i].picks.length; j++)
                        arr.push(this.selectedMatch.sets[i].picks[j])
                }
            }
            let maparr = arr.map((pickBan) => {
                const map = pickBan.map;
                map.name = pickBan.mapMod + (pickBan.mapPosition + 1);
                return map;
            });
            this.selectedMaps.push(maparr); //check
            console.log(this.selectedMaps)
            }
        }
        
    }

    async remove (match) {
        try {
            await axios.patch(`/api/referee/unref?id=${match.id}&type=${this.selectedStage}`)
            this.matches = this.matches.filter(match => match.matchID !== this.selectedMatch?.matchID);
        } catch (e) {
            if (e) alert(e);
        }
    }

    clipboard (text) {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        this.popupText = "Copied \"" + text + "\" to clipboard";
        this.showPopup = true;
        setTimeout(() => this.showPopup = false, 3000);
    }
    
    async addMP () {
        if (!this.regex.test(this.mp))
            return alert("Invalid mp link!");
        if (this.selectedMatch) {   
            this.matchloader = this.selectedStage === "QUALIFIERS" ? this.selectedMatch.id : this.selectedMatch.matchID;
        }
        const result = this.regex.exec(this.mp)?[2] : '';
        const data = {
            match: this.matchloader,
            id: this.matchloader,
            mp: result,
        }
        try {
            let errCheck;
            if (this.selectedStage === "QUALIFIERS")
                errCheck = (await axios.put('/api/qualifier/mp', data)).data;
            else
                errCheck = (await axios.patch('/api/matches/mp', data)).data;

            if (errCheck.error)
                alert(errCheck.error.name + ": " + errCheck.error.message);
        } catch (e) {
            alert(e)
        } finally {
            const refresh = (await axios.get(`/api/referee/${this.selectedStage}`)).data
            this.matches = refresh.matches
            this.mappool = refresh.mappool
            this.matchloader = "";
        }
    }
    async map (set, map, mapType) {
        if(this.selectedMatch)
            this.matchloader = this.selectedMatch.matchID;
        const data = {
            match: this.selectedMatch?.matchID,
            map: map < 0 ? this.matchBans[2*(set+1)+map].mapID : this.selectedMaps[set][map].mapID,
            mapType,
            mapNum: this.order[map],
            setNum: map < 0 ? -1 : set,
        }
        const res = (await axios.patch('/api/matches/map', data)).data;
        this.selectedMatch = res.match;
        this.addSelected();
        this.matchloader = "";
    }
    async first (winner) {
        if(this.selectedMatch)
            this.matchloader = this.selectedMatch.matchID;
        try {
            const data = {
                match: this.selectedMatch?.matchID,
                winner,
            }
            const res = (await axios.patch('/api/matches/first', data)).data;
            this.selectedMatch = res.match;
        } catch (e) {
            alert(e)
        }
        this.matchloader = "";
    }
}
</script>

<style>
.referee {
    display: flex;
    justify-content: center;
    padding: 50px;
}

.refereeStageSelection, .refereeMatchSelection,  .refereeCommandsSection, .refereeTeams, .refereeFormatSection {
    line-height: 1;
    font-size: 60px;
    font-weight: bold;
    text-shadow: 3.5px 3.5px 5px rgba(24,7,0,.75);
    padding: 25px;
    margin: 20px;
    background-color: #202020;
    border-radius: 10px;
    height: 100%;
}

.refereeMatchSelection {
    flex: 0.5;
}
.refereeMatchSection {
    display: flex;
    flex-direction: column;
}

.refereeTeams {
    flex: 1;
}

.refereePickBanFormat {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
}

.refereeSetSelected {
    font-weight: bold;
    text-shadow: 0 0 10px #b64c4c;
}

.refereeSetName {
    flex: 100%;
    text-align: center;
    font-weight: bold;
    font-size: 32px;
}

.refereePickBanTeam {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 20px;
    text-shadow: 0 0 10px rgba(182,76,76,.75);
    color: #b64c4c;
    padding-top: 10px;
    width: 50%;
    white-space: normal;
}

.matchBan {
    text-shadow: none;
    color: white;
    font-size: 15px;
}

.bannedMap {
    color: black;
    text-shadow: none;
    filter: blur(2px);
    cursor: initial;
}

.refereeFormatSection {
    flex: 4;
}

.pick, .ban, .empty {
    outline: 0;
    border: 0;
    height: 25px;
    width: 66px;
    margin: 5px;
    border-radius: 6px;
    font: inherit;
    font-size: 16px;
}

.ban {
    background-color: #b64c4c;
}

.pick {
    background-color: #b0e9c3;
}

.refereeStage, .refereeMatches {
    font-size: 30px;
    line-height: 2;
    font-weight: normal;
    color: #5f5f5f;
    letter-spacing: 6.8px;
    text-shadow: rgba(95, 95, 95, 0.75) 0px 0px 10px;
    cursor: pointer;
}
.refereeMatch {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.refereeActive {
    color: #b64c4c;
    text-shadow: 0 0 10px rgba(182,76,76,.75);
}

.refereeMatchTime {
    font-size: 20px;
    line-height: 1;
    letter-spacing: 3.4px;
}

.refereeSubHeader {
    font-size: 10px;
}

.refereeTeam, .refereeCommandsSubsection {
    font-size: 30px;
    font-weight: bold;
    text-shadow: 0 0 10px rgba(182,76,76,.75);
    color: #b64c4c;
    padding-top: 10px;
}

.refereeMembers, .refereeCommands {
    color: white;
    text-shadow: none;
    font-size: 15px;
    padding-top: 10px;
    padding-left: 15px;
    font-weight: normal;
    cursor: pointer;
}

.refereeChoiceSection {
    display: flex;
}

.refereeCommand {
    padding: 10px 0;
}

.refereeLinkInput {
    padding: 0 2px;
    font-size: 12px;
    color: #b64c4c;
    line-height: 15px;
    font-style: italic;
    background: 0;
    border: 0;
    outline: 0;
    font-family: inherit;
    cursor: initial;
}

.refereeModGroupHeader {
    font-weight: bold;
    text-decoration: underline;
}

.refereeFirst {
    cursor: pointer;
    font-weight: bold;
    color: #b64c4c;
}

.refereeSecond {
    cursor: pointer;
    font-weight: bold;
    color: #5f5f5f;
}

.refereeModGroupHeader, .refereeBeatmap {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.NM {
    color: #ffffff;
    text-shadow: 0 0 10px rgba(255,255,255,.75);
}

.HR {
    color: #e9b0b0;
    text-shadow: 0 0 10px rgba(233,176,176,.75);
}

.HD {
    color: #e9d4b0;
    text-shadow: 0 0 10px rgba(233,212,176,.75);
}

.DT {
    color: #d2b0e9;
    text-shadow: 0 0 10px rgba(210,176,233,.75);
}

.FM {
    color: #b0cfe9;
    text-shadow: 0 0 10px rgba(176,207,233,.75);
}

.TB {
    color: #b0e9c3;
    text-shadow: 0 0 10px rgba(176,233,195,.75);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease-out;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
