<template>
    <div class="teamPagePlayer">
        <img class="notCaptain" v-if="user.id === team.captain && edit" @click="cancel" src="../../../Assets/img/open/x.png">
        <a :href="'https://osu.ppy.sh/u/' + invite.osuUsername" target="_blank"><div class="teamPagePlayerName">{{ invite.osuUsername }}</div></a>
        <div class="teamPagePlayerPending">
            <div class="teamPagePlayerPending" v-html="$t('open.teams.team.invPend')"></div>
        </div>
    </div>
</template>

<script>
import axios from "axios";

export default {
    props: {
        edit: Boolean,
        invite: Object,
        team: Object,
        user: Object,
    },
    methods: {
        cancel: function() {
            axios.get('/api/team/cancel?invite=' + this.invite._id).then(result => {
                if (result.data.error !== false) {
                    alert(error)
                }
                else {
                    this.$emit('cancelled')
                }
            })
        }
    }
}
</script>

<style>
</style>
