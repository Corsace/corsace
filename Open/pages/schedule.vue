<template>
    <div class="schedule">
        <div class="schedule_main_content">
            <OpenTitle>
                SCHEDULE - {{ selectedStage?.abbreviation.toUpperCase() || '' }}
                <template #selector>
                    <StageSelector
                        :not-beginning="selectedStage?.ID !== stageList[0]?.ID"
                        :not-end="selectedStage?.ID !== stageList[stageList.length - 1]?.ID"
                        @prev="index--"
                        @next="index++"
                    >
                        <template #top_text>
                            STAGE
                        </template>
                        <template #bottom_text>
                            SELECT
                        </template>

                        <template #stage>
                            {{ selectedStage?.abbreviation.toUpperCase() || '' }}
                        </template>
                    </StageSelector>
                </template>
            </OpenTitle>
            <div class="schedule_main_content_matches">
                <ScheduleMatchBox
                    v-for="matchup in matchupList"
                    :key="matchup.ID"
                    :matchup="matchup"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import StageSelector from "../../Assets/components/open/StageSelector.vue";
import ScheduleMatchBox from "../../Assets/components/open/ScheduleMatchBox.vue";
import { Tournament } from "../../Interfaces/tournament";
import { Stage, StageType } from "../../Interfaces/stage";

import { namespace } from "vuex-class";
import { MatchupList } from "../../Interfaces/matchup";

const openModule = namespace("open");

@Component({
    components: {
        StageSelector,
        OpenTitle,
        ScheduleMatchBox,
    },
    head () {
        return {
            title: this.$store.state["open"].title,
            meta: [
                {hid: "description", name: "description", content: this.$store.state["open"].tournament.description},

                {hid: "og:site_name", property: "og:site_name", content: this.$store.state["open"].title},
                {hid: "og:title", property: "og:title", content: this.$store.state["open"].title},
                {hid: "og:url", property: "og:url", content: `https://open.corsace.io${this.$route.path}`}, 
                {hid: "og:description", property: "og:description", content: this.$store.state["open"].tournament.description},
                {hid: "og:image",property: "og:image", content: require("../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state["open"].title},
                {name: "twitter:description", content: this.$store.state["open"].tournament.description},
                {name: "twitter:image", content: require("../../Assets/img/site/open/banner.png")},
                {name: "twitter:image:src", content: require("../../Assets/img/site/open/banner.png")},
            ],
            link: [{rel: "canonical", hid: "canonical", href: `https://open.corsace.io${this.$route.path}`}],
        };
    },
})
export default class Schedule extends Vue {
    
    @openModule.State tournament!: Tournament | null;

    stageList: Stage[] = [];
    matchupList: MatchupList[] = [];
    index = 0;
    
    get selectedStage (): Stage | null {
        return this.stageList[this.index] || null;
    }

    @Watch("selectedStage")
    async stageMatchups () {
        if (!this.selectedStage) {
            this.matchupList = [];
            return;
        }
        
        const ID = this.selectedStage.ID;
        this.matchupList = [];

        await this.pause(500);
        if (ID !== this.selectedStage.ID) return;

        const { data } = await this.$axios.get(`/api/stage/${this.selectedStage.ID}/matchups`);

        this.matchupList = data.matchups.map(matchup => {
            matchup.date = new Date(matchup.date);
            return matchup;
        });
        this.matchupList.sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    async pause (ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    mounted () {
        this.stageList = this.tournament?.stages.filter(stage => stage.stageType !== StageType.Qualifiers) || [];
        this.index = this.stageList.findIndex(stage => stage.timespan.end.getTime() > Date.now());
    }
}

</script>

<style lang="scss">
@import '@s-sass/_variables';

.schedule {
    background: linear-gradient(180deg, #1F1F1F 0%, #131313 100%);

    &_main_content {
        background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
        display: flex;
        align-self: center;
        justify-content: center;
        flex-direction: column;
        width: 75vw;
        position: relative;
        padding: 35px;

        @media screen and (max-width: $breakpoint-xl) {
            width: 100vw;
        }

        &_matches{
            display: flex;
            flex-direction: column;
            margin-top: 20px;
            gap: 20px;
        }
    }
}
</style>