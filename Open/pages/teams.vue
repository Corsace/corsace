<template>
    <div class="teams_list">
        <div 
            v-if="teamList"
            class="teams_list__main_content"
        >
            <OpenTitle>
                TEAMS LIST
            </OpenTitle>
            <div class="teams_list__main_content_row">
                <OpenCardTeam>
                    <template #team_banner>
                        <img src="https://cdn.akamai.steamstatic.com/apps/csgo/images/csgo_react/social/cs2.jpg">
                    </template>
                    <template #team_name>
                        counter strike
                    </template>
                    <template #team_rank>
                        69
                    </template>
                    <template #team_avg_bws>
                        42
                    </template>
                </OpenCardTeam>
                <OpenCardTeam>
                    <template #team_banner>
                        <img src="https://i.imgur.com/k9COyEz.png">
                    </template>
                    <template #team_name>
                        the vtuber in the picture is
                    </template>
                    <template #team_rank>
                        1
                    </template>
                    <template #team_avg_bws>
                        99
                    </template>
                </OpenCardTeam>
                <OpenCardTeam>
                    <template #team_banner>
                        <img src="https://i.imgur.com/Jof2nBJ.png">
                    </template>
                    <template #team_name>
                        ceres fauna fanclub
                    </template>
                    <template #team_rank>
                        69
                    </template>
                    <template #team_avg_bws>
                        69
                    </template>
                </OpenCardTeam>
            </div>
            <div class="teams_list__main_content_row">
                <OpenCardTeam>
                    <template #team_banner>
                        <img src="https://cdna.artstation.com/p/assets/images/images/001/207/466/large/suke-22.jpg?1442249023">
                    </template>
                    <template #team_name>
                        legal legends
                    </template>
                    <template #team_rank>
                        99
                    </template>
                    <template #team_avg_bws>
                        77
                    </template>
                </OpenCardTeam>
                <OpenCardTeam>
                    <template #team_banner>
                        <img src="https://i.pinimg.com/originals/47/77/bc/4777bc26067bc7eb94715f1b9624f647.png">
                    </template>
                    <template #team_name>
                        coolest man alive
                    </template>
                    <template #team_rank>
                        1
                    </template>
                    <template #team_avg_bws>
                        88
                    </template>
                </OpenCardTeam>
            </div>
        </div>
        <div
            v-else 
            class="teams_list__main_content"
        >
            <OpenTitle>
                THIS PAGE IS A WORK IN PROGRESS
            </OpenTitle>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

import { BaseTeam } from "../../Interfaces/team";

import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import OpenCardTeam from "../../Assets/components/open/OpenCardTeam.vue";

@Component({
    components: {
        OpenTitle,
        OpenCardTeam,
    },
    head () {
        return {
            title: "Corsace Open",
        };
    },
})
export default class Teams extends Vue {
    teamList: BaseTeam[] | null = null;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.teams_list {
    background: linear-gradient(180deg, #1F1F1F 0%, #131313 100%);

    &__main_content {
        align-self: center;
        position: relative;
        width: 65vw;
        padding: 35px;
        background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);

        &_row {
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            margin-top: 25px;
        }
    }
}
</style>