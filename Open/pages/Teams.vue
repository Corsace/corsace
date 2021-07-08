<template>
    <div class="teams">
        <div class="teamsHeader">{{ $t('open.teams.list') }}</div>
        <div class="teamInside" v-if="inTeam">
            <div class="teamPP">{{ $t('open.teams.your') }}</div>
            <div class="teamTitle"><router-link to="/team">{{ team.name }}</router-link></div>
        </div>
        <div v-else-if="!inTeam && registered" @click="teamRegisteringToggle"><router-link to="/team" class="createTeam">{{ $t('open.teams.create') }}</router-link></div>
        <div class="teamsList" v-if="!loading">
            <div v-for="(team, index) in teams" :key="index">
                <team-list-component :team="team"></team-list-component>
            </div>
        </div>
        <div v-else-if="loading">
            <Loading></Loading>
        </div>
    </div>
</template>

<script lang='ts'>
import axios from "axios";
import TeamListComponent from "../components/teams/TeamListComponent.vue";
import Loading from "../components/Loading.vue";
import { Vue, Component, Prop } from "vue-property-decorator";
import { State, Action } from "vuex-class";


import regeneratorRuntime from "regenerator-runtime";

@Component({
    components: {
        TeamListComponent,
        Loading,
    }
})

export default class Teams extends Vue {

    @State teams!: Object;
    @State loading!: Boolean;

    @Prop(Boolean) readonly inTeam!: Boolean;
    @Prop(Boolean) readonly registered!: Boolean;
    @Prop(Object) readonly team!: Object;
    async created () {
        await this.$store.dispatch("teams/fetchAllTeams");
    }

    toogleLoginModal (): void {
        this.$emit('team-registering')
    }

}
</script>

<style>
.teams {
    display: grid;
    flex-direction: column;
    justify-items: center;
    align-items: center;
    text-align: center;
    grid-template-columns: 2fr 2fr 3fr 3fr 3fr 3fr 2fr 2fr;
}

.teamsHeader {
    line-height: 1;
    font-size: 60px;
    font-weight: bold;
    text-shadow: 3.5px 3.5px 5px rgba(24,7,0,.75);
    padding: 40px 0;
    grid-column: 4/6;
}

.teamsList {
    position: relative;
    display: grid;
    grid-column: 3/7;
    grid-gap: 20px;
    grid-template-columns: repeat(4, 270px);
    width: 100%;
    white-space: nowrap;
    margin-bottom: 20px;
}

.wrapper {
    position: relative;
    cursor: pointer;
}

.team {
    display: grid;
    grid-row-gap: 18px;
    justify-items: center;
    background-color: #202020;
    box-shadow: 3.5px 3.5px 19px 1px rgba(24, 7, 0, 0.5);
    width: 100%;
    height: 100%
}

.overlay {
    display: grid;
    position: absolute;
    top: 0;
    grid-row-gap: 0;
}

.teamAvatar {
    padding-top: 20px;
    height: 100px;
    width: 100px;
}

.teamInfo {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.teamTitle {
    display: flex;
    align-items: center;
    font-size: 18px;
    color: #c8cfd5;
    letter-spacing: 4.7px;
    padding-bottom: 9px;
    text-shadow: 0 0 10px rgba(200,207,213,.75);
}

.verifiedLogo {
    height: 25px;
    width: 25px;
}

.teamPP, .teamPlayerPP {
    font-size: 14px;
    color: #866662;
    letter-spacing: 1.4px;
    text-shadow: 0 0 10px rgba(134,102,98, 0.75);
}

.teamSeed {
    display:flex;
    justify-content: center;
}

.teamASeedText, .teamBSeedText, .teamCSeedText, .teamDSeedText, .teamUnSeedText, .createTeam {
    font-size: 16px;
    letter-spacing: 1.6px;
    padding: 7px 9px;
    border: solid;
    border-radius: 14px;
    margin-bottom: 20px;
    text-align: center;
}

.teamASeedText {
    color: #fff17e;
    text-shadow: 0 0 10px rgba(255,241,126,.75);
    box-shadow: 0 0 10px rgba(255,241,126,.75);
}

.teamBSeedText {
    color: #96ff7e;
    text-shadow: 0 0 10px rgba(150,255,126,.75);
    box-shadow: 0 0 10px rgba(150,255,126,.75);
}

.teamCSeedText {
    color: #67fdff;
    text-shadow: 0 0 10px rgba(103,253,255,.75);
    box-shadow: 0 0 10px rgba(103,253,255,.75);
}

.teamDSeedText {
    color: #be7eff;
    text-shadow: 0 0 10px rgba(190,126,255,.75);
    box-shadow: 0 0 10px rgba(190,126,255,.75);
}

.teamUnSeedText {
    color:#ff7d6d;
    text-shadow: 0 0 10px rgba(255,125,109,.75);
    box-shadow: 0 0 10px rgba(255,125,109,.75);
}

.teamPlayerWrapper {
    align-content: space-evenly;
    display: grid;
    justify-self: stretch;
    padding: 5px 10px;
}

.teamPlayer {
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: 1fr 4fr 4fr;
    width: 100%;
    align-items: center;
}

.teamListCaptain {
    justify-self: start;
    grid-column: 1/2;
    padding: 0;
}

.teamPlayerName {
    font-size: 14px;
    color: #c8cfd5;
    text-shadow: 0 0 10px rgba(200,207,213,.75);
    justify-self: start;
    grid-column: 2/3;
}

.teamPlayerPP {
    justify-self: end;
    grid-column: 3/4;
}

.createTeam, .teamInside {
    grid-column: 6/7;
    justify-self: right;
}

.teamInside {
    text-align: right;
}

.createTeam {
    color: #38bc34;
    text-shadow: 0 0 10px rgba(56,188,52,.75);
    box-shadow: 0 0 10px rgba(56,188,52,.75);
    cursor: pointer;
    white-space: nowrap;
}
</style>
