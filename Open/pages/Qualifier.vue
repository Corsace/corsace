<template>
    <div class="qualifierWrapper">
        <div class="qualifier" v-if="!loading">
            <div class="staffEditMatch" v-if="!edit && (loggedInUser.isScheduler || (qualifier.referee && qualifier.referee.corsaceID === loggedInUser.corsaceID))" @click="edit=true">
                <img src="../../Assets/img/open//editMappool.png"> EDIT QUALIFIER
            </div>
            <div class="staffEditMatch active" v-else-if="edit" @click="edit=false">
                <img src="../../Assets/img/open/editSave.png"> SAVE MATCH RESULT
            </div>
            <div class="qualifierTop">
                <div>{{ $t('open.header.qualifiers') }}</div>
                <div class="qualifierTime">
                    SEP {{this.qualifier.time.toUTCString().split(" ")[1]}}
                    <br>
                    {{this.qualifier.time.toUTCString().split(" ")[4].slice(0,5)}} UTC
                    <br>
                    <input v-if="edit && ((qualifier.referee && qualifier.referee.corsaceID === loggedInUser.corsaceID) || loggedInUser.staff.headStaff)" class="qualifierLinkInput" :placeholder="mp === '' ? 'enter osu!mp url' : mp" v-model="mp" @input="addMP">
                    <a v-else :href="qualifier.mp ? `https://osu.ppy.sh/community/matches/${qualifier.mp}` : null"><img v-if="qualifier.mp" src="../../Assets/img/open/osuMatch.png"></a>
                </div>
            </div>
            <div class="qualifierList" v-if="qualifier">
                <div :style="loggedInUser.isReferee ? {cursor: 'pointer'} : null" @click="loggedInUser.isReferee ? staffReg() : null">
                    <span class="qualifierListed bold" v-if="qualifier.referee && loggedInUser.corsaceID === qualifier.referee.corsaceID">-</span><span class="qualifierListed bold" v-else-if="loggedInUser.isReferee">+</span> {{ $t('open.match.referees') }}: <span class="qualifierListed" v-if="qualifier.referee">{{ qualifier.referee.osu.username }}</span>
                </div>
                <div :style="loggedInUser.team && loggedInUser.team.captain === loggedInUser.corsaceID ? {cursor: 'pointer'} : null" @click="loggedInUser.team && loggedInUser.team.captain === loggedInUser.corsaceID ? teamReg() : null">
                    <span class="qualifierListed bold" v-if="inQualifier">-</span><span class="qualifierListed bold" v-else-if="loggedInUser.team && loggedInUser.team.captain === loggedInUser.corsaceID">+</span> {{ $t('open.header.teams') }}: <span class="qualifierListed" v-if="qualifier.teams"><span v-for="(team, index) in qualifier.teams" :key="index">{{ team.name }}<span v-if="index + 1 < qualifier.teams.length">, </span></span></span>
                </div>
            </div>
            <div class="qualifierTableChoice">
                <div @click="subSection='teams'; scoringType === 'costs' ? scoringType='sum' : null" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: subSection==='teams' }">{{ $t('open.header.teams') }}</div>
                <div @click="subSection='players'; scoringType === 'seeding' || scoringType === 'average' ? scoringType='sum' : null" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: subSection==='players' }">{{ $t('open.header.players') }}</div>
            </div>
            <div class="qualifierTableChoice">
                <div @click="scoringType='average'" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: scoringType==='average' }" v-if="subSection==='teams'">AVERAGE</div>
                <div @click="scoringType='sum'" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: scoringType==='sum' }">SUM</div>
                <div @click="scoringType='max'" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: scoringType==='max' }">%MAX</div>
                <div @click="scoringType='avg'" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: scoringType==='avg' }">%AVG</div>
                <div @click="scoringType='costs'" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: scoringType==='costs' }" v-if="subSection==='players'">COSTS</div>
                <div @click="scoringType='seeding'" class="qualifiersSubHeader" :class="{ qualifiersSubHeaderActive: scoringType==='seeding' }" v-if="subSection==='teams'">SEEDING</div>
            </div>
            <span v-if="scoringType==='costs'" style='display: flex; justify-content: center; padding-top:20px'>Costs method derived from Megatron is Bad's match costs algorithm</span>
            <qualifier-scores-table :scores="qualifier.scores" :mappool="mappool" :teams="qualifier.teams" :subSection="subSection" :scoringType="scoringType"></qualifier-scores-table>
        </div>
        <div v-else-if="loading">
            <loading></loading>
        </div>
    </div>
</template>

<script lang='ts'>
import axios from "axios";
import Loading from "../components/Loading.vue";
import QualifierScoresTable from "../components/qualifiers/QualifierScoresTable.vue";
import { Component, Vue } from "vue-property-decorator"
import { State } from "vuex-class"
import { QualifierLobby } from "../../Interfaces/qualifier";
import { MappoolInfo, MappoolMap, ModGroup } from "../../Interfaces/mappool";
import { UserOpenInfo } from "../../Interfaces/user";

@Component({
    name: 'qualifier',
    components: {
        QualifierScoresTable,
        Loading,
    }
})

export default class Qualfier extends Vue {

    @State loggedInUser!: UserOpenInfo

    subSection = "players"
    scoringType = "seeding"
    edit = false
    mp = ""
    loading = true
    qualifier: QualifierLobby | null = null
    mappool: MappoolInfo | null = null
    regex = /^https:\/\/osu\.ppy\.sh\/(mp|community\/matches)\/(\d+)/

    async mounted () {
        this.loading = true;
        await this.refresh();
        this.loading = false;
    }

    inQualifier () {
        if (this.loggedInUser.team && this.loggedInUser.team.captain === this.loggedInUser.corsaceID && this.qualifier?.teams.some(team => team.captain === this.loggedInUser.corsaceID))
            return true;
        return false;
    }

    async refresh () {
        const { data } = await axios.get(`/api/qualifier/${this.$route.params.id}`)
        if (data.error)
            return alert(data.error)
        
        this.qualifier = data.qualifier;
        this.mappool = data.mappool;
    }

    async addMP () {
        if (!this.regex.test(this.mp))
            return alert("Invalid mp link!");
        const result = this.regex.exec(this.mp)?[2] : '';
        const data = {
            id: this.qualifier?.id,
            mp: result,
        }
        try {
            const errCheck = (await axios.put('/api/qualifier/mp', data)).data;
            if (errCheck.error)
                alert(errCheck.error.name + ": " + errCheck.error.message);
            
        } catch (e) {
            alert(e)
        }
        
        await this.refresh();
    }
    async staffReg () {
        try {
            const { data } = await axios.patch(`/api/qualifier/referee?id=${this.$route.params.id}`);
            if (data.error)
                alert(data.error)
        } catch (e) {
            if (e.response.status === 403)
                alert("You must have the referee role on discord to sign up as a referee!");
            else if (e.response.status === 400)
                alert("Please provide a valid qualifier ID / you are not allowed to sign up as a referee!");
        }
        await this.refresh();
    }

    async teamReg () {
        try {
            const { data } = await axios.patch(`/api/qualifier/team?id=${this.$route.params.id}`);
            if (data.error)
                alert(data.error)
        } catch (e) {
            console.log(e.response);
            if (e.response.status === 403)
                alert("You must be the captain of a team with 6+ members / qualifier signup period has passed!");
            else if (e.response.status === 400)
                alert("Please provide a valid qualifier ID / this qualifier already has 4 teams!");
        }
        await this.refresh();
    }

}
</script>

<style>

.qualifierWrapper {
    display: flex;
    align-items: center;
    justify-content: center;
}

.qualifier {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    margin-top: 40px;
    padding: 40px;
    background-color: #202020;
}

.staffEditMatch {
    color: #866662;
    cursor: pointer;
    font-size: 24px;
    display: grid;
    grid-column-gap: 5px;
    grid-auto-flow: column;
    justify-self: end;
}

.active {
    color: #2fc45c;
}

.qualifierTop {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 4rem;
    font-weight: bold;
}

.qualifierTime {
    font-weight: bold;
    font-size: 1.5rem;
}

.qualifiersSubHeader {
    cursor: pointer;
    color: #5f5f5f;
    padding: 0 20px;
}

.qualifiersSubHeaderActive {
    color: #b64c4c;
    text-shadow: 0 0 10px rgba(182,76,76,.75);
}

.qualifierTableChoice {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    font-size: 18px;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 10px;
}

.qualifierList {
    background-color: rgba(0, 0, 0, 0.5);
    font-size: 20px;
    font-weight: bold;
    padding: 15px;
    min-width: 0;
    min-height: 0;
    width: calc(100% - 30px);
    margin-top: 10px;
    display: flex;
}

.qualifierList > div {
    flex: 50%;
}

.qualifierListed {
    font-weight: normal;
    color: #b64c4c;
}

.bold {
    font-weight: bold;
}

.qualifierLinkInput {
    text-align: right;
    padding: 0 2px;
    font-size: 12px;
    color: #b64c4c;
    line-height: 15px;
    font-style: italic;
    background: 0;
    border: 0;
    outline: 0;
    font-family: inherit;
}
</style>