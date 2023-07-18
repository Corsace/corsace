<template>
    <div class="teams_list">
        <div 
            v-if="teamList"
            class="teams_list__main_content"
        >
            <OpenTitle>
                TEAMS LIST
            </OpenTitle>
            <div class="teams_list__main_content_list">
                <OpenCardTeam
                    v-for="team in teamList"
                    :key="team.ID"
                    :team="team"
                />
            </div>
        </div>
        <div
            v-else-if="loading"
            class="teams_list__main_content"
        >
            <OpenTitle>
                LOADING...
            </OpenTitle>
        </div>
        <div
            v-else 
            class="teams_list__main_content"
        >
            <OpenTitle>
                COULD NOT GET TEAM LIST...
            </OpenTitle>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";

import { Tournament } from "../../Interfaces/tournament";
import { TeamList } from "../../Interfaces/team";

import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import OpenCardTeam from "../../Assets/components/open/OpenCardTeam.vue";

const openModule = namespace("open");

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
    @openModule.State tournament!: Tournament | null;
    @openModule.State teamList!: TeamList[] | null;

    loading = true;

    async mounted () {
        this.loading = true;
        if (this.tournament)
            await this.$store.dispatch("open/setTeamList", this.tournament.ID);
        this.loading = false;
    }
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

        &_list {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: flex-start;
            margin-top: 25px;
        }
    }
}
</style>