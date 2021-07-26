<template>
    <div class="teamPagePlayer">
        <img class="notCaptain" v-if="loggedInUser.corsaceID === team.captain && edit" @click="cancel" src="../../../Assets/img/open/x.png">
        <a :href="'https://osu.ppy.sh/u/' + invite.osuUsername" target="_blank"><div class="teamPagePlayerName">{{ invite.osuUsername }}</div></a>
        <div class="teamPagePlayerPending">
            <div class="teamPagePlayerPending" v-html="$t('open.teams.team.invPend')"></div>
        </div>
    </div>
</template>

<script lang='ts'>
import axios from "axios";
import { Component, Vue, Prop } from "vue-property-decorator"
import { Invitation } from "../../../Interfaces/invitation";
import { TeamInfo } from "../../../Interfaces/team";
import { UserOpenInfo } from "../../../Interfaces/user";
import { State } from "vuex-class"

@Component
export default class PlayerInvited extends Vue {
    
    @State loggedInUser!: UserOpenInfo

    @Prop(Boolean) readonly edit!: boolean;
    @Prop(Object) readonly invite!: Invitation
    @Prop(Object) readonly team!: TeamInfo

    cancel () {
        axios.get('/api/team/cancel?invite=' + this.invite._id).then(result => {
            if (result.data.error !== false) {
                alert(result.data.error)
            }
            else {
                this.$emit('cancelled')
            }
        })
    }
    
}
</script>

<style>
</style>
