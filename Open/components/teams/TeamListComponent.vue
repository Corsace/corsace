<template>
    <div class="wrapper" @mouseenter="active = !active" @mouseleave="active = !active">
        <router-link :to="`/team/${team.slug}`">
            <div class="team">
                <img class="teamAvatar" v-if="team.teamAvatarUrl !== null" v-bind:src="team.teamAvatarUrl">
                <img class="teamAvatar" v-if="team.teamAvatarUrl === null" src="../../../Assets/img/open/defaultTeamAvatar.png">
                <div class="teamInfo">
                    <div class="teamTitle">
                        <div>{{ team.name }}</div>
                    </div>
                    <div class="teamPP">{{ Math.round(team.averageBWS) }} BWS</div>
                </div>
                <div :class="`team${team.seed ? team.seed : 'Un'}SeedText`">{{ team.seed ? `RANK ${team.rank}` : 'UNRANKED' }}</div>
            </div>
            <transition name="fade">
                <div class="team overlay" v-show="active === true">
                    <div class="teamPlayerWrapper">
                        <div class="teamPlayer" v-for="(member, index) in team.members" :key="index">
                            <img class="captain teamListCaptain" v-if="member.id.toString() === team.captain" src="../../../Assets/img/open/captain.png">
                            <div class="teamPlayerName">{{ member.username }}</div>
                            <div class="teamPlayerPP">{{ Math.round(Math.pow(member.rank, Math.pow(0.9937, Math.pow(member.badges, 2)))) }} BWS</div>
                        </div>
                    </div>
                </div>
            </transition>
        </router-link>
    </div>
</template>

<script>
import axios from "axios";

export default {
    data: () => ({
        active: false,
    }),
    props: {
        team: Object,
    },
}
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease-out;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
