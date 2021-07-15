<template>
    <div>
        <div class="qualifiers" v-if="!loading">
            <div class="qualifiersSubHeaders">
                <div @click="section='mappool'" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: section==='mappool' }" v-if="mappool">{{ $t('open.header.mappool') }}</div>
                <div @click="section='qualifiers'" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: section==='qualifiers' }">{{ $t('open.header.qualifiers') }}</div>
                <div @click="section='scores'" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: section==='scores' }">{{ $t('open.header.scores') }}</div>
            </div>
            <div v-if="section==='scores'" class="qualifiersSubHeaders" style="margin-top:20px;">
                <div @click="subSection='teams'; scoringType === 'costs' ? scoringType='sum' : null" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: subSection==='teams' }">{{ $t('open.header.teams') }}</div>
                <div @click="subSection='players'; scoringType === 'seeding' || scoringType === 'average' ? scoringType='sum' : null" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: subSection==='players' }">{{ $t('open.header.players') }}</div>
            </div>
            <div v-if="section==='scores'" class="qualifiersSubHeaders" style="margin-top:20px;">
                <div @click="scoringType='average'" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: scoringType==='average' }" v-if="subSection==='teams'">AVERAGE</div>
                <div @click="scoringType='sum'" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: scoringType==='sum' }">SUM</div>
                <div @click="scoringType='max'" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: scoringType==='max' }">%MAX</div>
                <div @click="scoringType='avg'" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: scoringType==='avg' }">%AVG</div>
                <div @click="scoringType='costs'" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: scoringType==='costs' }" v-if="subSection==='players'">COSTS</div>
                <div @click="scoringType='seeding'" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: scoringType==='seeding' }" v-if="subSection==='teams'">SEEDING</div>
            </div>
            <div class="qualifiersTop">
                <div class="qualifiersLeft" v-if="user.isHeadStaff" @click="publicize">
                    <div class="teamPP">SCORES PUBLIC</div>
                    <div class="qualifiersTeamTitle">{{qualifiers[0].public}}</div>
                </div>
                <div class="qualifiersHeader">{{ $t('open.header.qualifiers') }}</div>
                <div class="qualifiersTeamInside" v-if="inTeam">
                    <div class="teamPP">{{ $t('open.teams.your') }}</div>
                    <div class="qualifiersTeamTitle"><router-link to="/team">{{ team.name }}</router-link></div>
                </div>
            </div>
            <div class="qualifiersList" v-if="section==='qualifiers'">
                <div v-for="(qualifier, index) in qualifiers" :key="index">
                    <qualifier-list-component :qualifier="qualifier"></qualifier-list-component>
                </div>
            </div>
            <div v-else-if="section==='scores'">
                <span v-if="scoringType==='costs'" style='display: flex; justify-content: center;'>Costs method derived from Megatron is Bad's match costs algorithm</span>
                <qualifier-scores-table :scores="scores" :mappool="mappool" :teams="teams" :list="subSection" :showQualifiers="subSection==='teams' ? true : false" :scoringType="scoringType"></qualifier-scores-table>
            </div>
            <div v-else class="qualifierMappoolList">
                <a class="qualifierLink" v-if="mappool.mappack" :href="mappool.mappack">
                    <div>
                        <img src="../../Assets/img/open/pool.png">
                        MAPPACK
                    </div>
                </a>
                <a class="qualifierLink" v-if="mappool.sheet" :href="mappool.sheet">
                    <div>
                        <img src="../../Assets/img/open/sched.png">
                        SHEET VER
                    </div>
                </a>
                <div v-for="(modGroup, index) in mappool.modGroups" :key="index">
                    <ModGroupComponent :user="user" :mod-group="modGroup" :round="mappool.name"></ModGroupComponent>
                </div>
            </div>
        </div>
        <div v-else-if="loading">
            <loading></loading>
        </div>
    </div>
</template>

<script lang='ts'>
import axios from "axios";
import regeneratorRuntime from "regenerator-runtime";
import Loading from "../components/Loading.vue";
import QualifierListComponent from "../components/qualifiers/QualifierListComponent.vue";
import QualifierScoresTable from "../components/qualifiers/QualifierScoresTable.vue";
import ModGroupComponent from "../components/mappool/ModGroupComponent.vue";
import { Vue, Component } from "vue-property-decorator"
import { namespace, State, Action } from "vuex-class"
import { TeamInfo } from "../../Interfaces/team"
import { UserOpenInfo } from "../../Interfaces/user";

const qualifierModule = namespace("qualifier")

@Component({
    components: { 
        ModGroupComponent,
        QualifierListComponent,
        QualifierScoresTable,
        Loading,
    }
})

export default class Qualifiers extends Vue {

    @qualifierModule.State qualifiers!: null
    @qualifierModule.State scores!: null
    @qualifierModule.State mappool!: null
    @qualifierModule.State teams!: null
    @qualifierModule.State section!: string
    @qualifierModule.State subSection!: string
    @qualifierModule.State scoringType!: string
    @qualifierModule.Action publicize;

    @State inTeam!: Boolean;
    @State team!: TeamInfo;
    @State loggedInUser!: UserOpenInfo;

    loading = true
        
    async created() {
        this.loading = true;
        await this.$store.dispatch("qualifier/refresh");
        this.loading = false;
    }

}
</script>

<style>
.qualifiers {
    margin-top: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}

.qualifiersSubHeaders {
    display: flex;
    font-size: 20px;
    letter-spacing: 6.8px;
    text-shadow: 0 0 10px rgba(95,95,95,.75);
}
.qualifiersSubHeaders > a, .qualifiersSubHeaders > div {
    padding: 0 17px;
}

.qualifiersSubHeader {
    cursor: pointer;
    color: #5f5f5f;
}

.qualifiersSubHeaderActive {
    color: #b64c4c;
    text-shadow: 0 0 10px rgba(182,76,76,.75);
}

.qualifiersTop {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 40px 0;
}

.qualifiersLeft {
    cursor: pointer;
}

.qualifiersHeader {
    line-height: 1;
    font-size: 60px;
    font-weight: bold;
    text-shadow: 3.5px 3.5px 5px rgba(24,7,0,.75);
    grid-column: 2/3;
}

.teamPP {
    font-size: 14px;
    color: #866662;
    letter-spacing: 1.4px;
    text-shadow: 0 0 10px rgba(134,102,98, 0.75);
}

.qualifiersTeamTitle {
    align-items: center;
    font-size: 18px;
    color: #c8cfd5;
    letter-spacing: 4.7px;
    padding-bottom: 9px;
    text-shadow: 0 0 10px rgba(200,207,213,.75);
}

.qualifiersTeamInside {
    text-align: right;
}

.qualifiersList {
    display: flex;
    flex-wrap: wrap;
    width: 50%;
    justify-content: center;
}

.qualifierMappoolList {
    display: flex;
    width: 50%;
    flex-direction: column;
    margin-bottom: 35px;
    font-size: 24px;
    white-space: nowrap;
}

.qualifierLink {
    padding-bottom: 10px;
    display: flex;
    justify-content: center;
}
</style>