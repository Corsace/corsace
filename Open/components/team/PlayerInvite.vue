<template>
    <div class="teamPagePlayer">
        <input class="teamPagePlayerInput" v-model="playerInvite" v-bind:placeholder="$t('open.registration.placeholder')" @mouseover="active = !active" @mouseleave="active = !active" @keydown.enter="invite"/>
        <div class="teamPagePlayerInvite" @click="invite">{{ $t('open.teams.team.inv') }}</div>
    </div>
</template>

<script lang='ts'>
import axios from "axios";
import { Component, Vue } from "vue-property-decorator"

@Component
export default class PlayerInvite extends Vue {

    active = false
    playerInvite = ""
    invite () {
        axios.get('/api/team/invite?target=' + this.playerInvite).then(result => {
            if (result.data.error !== false) {
                alert(error)
            }
            else {
                this.$emit('invited')
            }
        }).catch((error) => {
            console.error(error);
            alert((this.$t('open.teams.team.playerInvite') as string).replace("%%member%%", this.playerInvite));
        })
    }
    
}
</script>

<style>
</style>
