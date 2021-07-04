<template>
    <div class="qualifiterListComponent">
        <router-link :to="`/qualifier/${qualifier.id}`">
            <div class="qualifiersTime">
                <div>
                    {{day}}
                    <br>
                    {{time}} UTC
                </div>
                <img v-if="qualifier.referee" src="../../../Assets/img/open/ref.png">
            </div>
            <div class="qualifiersTeams">
                <div v-for="index in 4" :key="index">
                    <div v-if="qualifier.teams[index-1]" class="qualifiersTeam">
                        <img v-if ="qualifier.teams[index-1].teamAvatarUrl" :src="qualifier.teams[index-1].teamAvatarUrl">
                        <img v-else src="../../../Assets/img/open/defaultTeamAvatar.png">
                        {{ qualifier.teams[index-1].name }}
                    </div>
                    <div v-else class="qualifiersTeam">
                        <img src="../../../Assets/img/open/defaultTeamAvatar.png">
                        <span class="qualifiersBold">{{ $t('open.match.empty') }}</span>
                    </div>
                </div>
            </div>
        </router-link>
    </div>
</template>

<script>
export default {
    props: {
        qualifier: Object,
    },
    computed: {
        day: function() {
            return "SEP " + this.qualifier.time.split('-')[2].split('T')[0];
        },
        time: function() {
            return this.qualifier.time.split('T')[1].slice(0,5);
        },
    }
}
</script>

<style>
.qualifiterListComponent {
    margin: 20px;
    padding: 20px;
    background: #202020;
    cursor: pointer;
}

.qualifiersTime {
    font-weight: bold;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.qualifiersTeam {
    padding: 10px 0;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 360px;
}

.qualifiersTeam > img {
    height: 50px;
}

.qualifiersBold {
    font-weight: bold;
    text-shadow: 0 0 10px rgba(182,76,76,.75);
    color: #b64c4c;
}
</style>