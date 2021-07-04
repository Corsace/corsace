<template>
    <div class="teamPagePlayer">
        <div class="captainIcons">
            <img class="captain" v-if="member.id.toString() === team.captain" src="../../../Assets/img/open/captain.png">
            <img class="notCaptain" v-if="user.id === team.captain && member.id.toString() !== team.captain && edit" @click="kick" src="../../../Assets/img/open/x.png">
            <img class="notCaptain" v-if="user.id === team.captain && member.id.toString() !== team.captain && edit" @click="transferCaptain" src="../../../Assets/img/open/transferCaptain.png">
            <img class="notCaptain" v-if="user.id === member.id.toString() && member.id.toString() !== team.captain" @click="leave" src="../../../Assets/img/open/x.png">
        </div>
        <a :href="'https://osu.ppy.sh/u/' + member.username" target="_blank"><div class="teamPagePlayerName">{{ member.username }}</div></a>
        <div class="teamPagePlayerPP">
            <div class="teamPageNumbers">{{ Math.round(Math.pow(member.rank, Math.pow(0.9937, Math.pow(member.badges, 2)))) }}</div>
            <div class="teamPageDesc">{{ $t('open.teams.team.pp') }}</div>
        </div>
    </div>
</template>

<script>
import axios from "axios";

export default {
    props: {
        edit: Boolean,
        member: Object,
        user: Object,
        team: Object,
    },
    methods: {
        leave: function() {
            if(confirm(this.$i18n.messages[this.$i18n.locale].open.teams.team.playerRemoveSelf)) {
                axios.get('/api/team/leave').then(result => this.$emit("alert")).catch(err => alert(err));
            }
        },
        kick: function() {
            if(confirm(this.$i18n.messages[this.$i18n.locale].open.teams.team.playerRemove.replace("%%member%%", this.member.username)))
                axios.get('/api/team/kick?target=' + this.member.id).then(result => this.$emit("update")).catch(err => alert(err));
        },
        transferCaptain: function() {
            if(confirm(this.$i18n.messages[this.$i18n.locale].open.teams.team.playerCaptain.replace("%%member%%", this.member.username))) {
                axios.get('/api/team/transferCaptain?target=' + this.member.id).then(result => {
                    this.$emit("update");
                    this.$emit("transfer");
                }).catch(err => alert(err));
            }
        }
    }
}
</script>
