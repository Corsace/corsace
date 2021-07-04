<template>
    <div class="teamPagePlayer">
        <input class="teamPagePlayerInput" v-model="playerInvite" v-bind:placeholder="$t('open.registration.placeholder')" @mouseover="active = !active" @mouseleave="active = !active" @keydown.enter="invite"/>
        <div class="teamPagePlayerInvite" @click="invite">{{ $t('open.teams.team.inv') }}</div>
    </div>
</template>

<script>
import axios from "axios";

export default {
    data: () => ({
        active: false,
        playerInvite: "",
    }),
    methods: {
        invite: function() {
            axios.get('/api/team/invite?target=' + this.playerInvite).then(result => {
                if (result.data.error !== false) {
                    alert(error)
                }
                else {
                    this.$emit('invited')
                }
            }).catch((error) => {
                console.error(error);
                alert(this.$i18n.messages[this.$i18n.locale].open.teams.team.playerInvite.replace("%%member%%", this.playerInvite));
            })
        }
    }
}
</script>

<style>
</style>
