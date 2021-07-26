<template>
    <div class="teamPagePlayer">
        <div class="captainIcons">
            <img class="captain" v-if="member.corsaceID.toString() === team.captain" src="../../../Assets/img/open/captain.png">
            <img class="notCaptain" v-if="loggedInUser.corsaceID === team.captain && member.corsaceID.toString() !== team.captain && edit" @click="kick" src="../../../Assets/img/open/x.png">
            <img class="notCaptain" v-if="loggedInUser.corsaceID === team.captain && member.corsaceID.toString() !== team.captain && edit" @click="transferCaptain" src="../../../Assets/img/open/transferCaptain.png">
            <img class="notCaptain" v-if="loggedInUser.corsaceID === member.corsaceID.toString() && member.corsaceID.toString() !== team.captain" @click="leave" src="../../../Assets/img/open/x.png">
        </div>
        <a :href="'https://osu.ppy.sh/u/' + member.osu.username" target="_blank"><div class="teamPagePlayerName">{{ member.osu.username }}</div></a>
        <div class="teamPagePlayerPP">
            <div class="teamPageNumbers">{{ Math.round(Math.pow(member.rank, Math.pow(0.9937, Math.pow(member.badges, 2)))) }}</div>
            <div class="teamPageDesc">{{ $t('open.teams.team.pp') }}</div>
        </div>
    </div>
</template>

<script lang='ts'>
import axios from "axios";
import { Component, Vue, Prop } from "vue-property-decorator"
import { State } from "vuex-class"
import { TeamInfo } from "../../../Interfaces/team";
import { UserOpenInfo } from "../../../Interfaces/user";

@Component
export default class PlayerAccepted extends Vue {

    @State loggedInUser!: UserOpenInfo

    @Prop(Boolean) readonly edit!: boolean
    @Prop(Object) readonly team!: TeamInfo
    @Prop(Object) readonly member!: UserOpenInfo

    leave () {
        if(confirm(this.$t('open.teams.team.playerRemoveSelf') as string)) {
            axios.get('/api/team/leave').then(result => this.$emit("alert")).catch(err => alert(err));
        }
    }

    kick () {
        if(confirm((this.$t('open.teams.team.playerRemove') as string).replace("%%member%%", this.member.osu.username)))
            axios.get('/api/team/kick?target=' + this.member.corsaceID).then(result => this.$emit("update")).catch(err => alert(err));
    }

    transferCaptain () {
        if(confirm((this.$t('open.teams.team.playerCaptain') as string).replace("%%member%%", this.member.osu.username))) {
            axios.get('/api/team/transferCaptain?target=' + this.member.corsaceID).then(result => {
                this.$emit("update");
                this.$emit("transfer");
            }).catch(err => alert(err));
        }
    }
    
}
</script>
