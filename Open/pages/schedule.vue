<template>
    <div class="schedule">
        <div class="schedule_main_content">
            <OpenTitle>
                SCHEDULE - {{ stage?.abbreviation }}
                <template #selector>
                    <StageSelector>
                        <template #top_text>
                            STAGE
                        </template>
                        <template #bottom_text>
                            SELECT
                        </template>

                        <template #stage>
                            QL
                        </template>
                    </StageSelector>
                </template>
            </OpenTitle>
            <ScheduleMatchBox>
                
            </ScheduleMatchBox>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import StageSelector from "../../Assets/components/open/StageSelector.vue";
import ScheduleMatchBox from "../../Assets/components/open/ScheduleMatchBox.vue";
import { Tournament } from "../../Interfaces/tournament";
import { Stage } from "../../Interfaces/stage";

import { namespace } from "vuex-class";

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
export default class Mappool extends Vue {
    
    @openModule.State tournament!: Tournament | null;
    
    selectedStage = 0;
    
    get stageList (): {
        ID: number; 
        name: string; 
        order: number;
    }[] {
        const stages = this.tournament?.stages.map<{
            ID: number; 
            name: string; 
            order: number;
        }>(s => {
            return {
                ID: s.ID,
                name: s.name,
                order: s.order,
            };
        }) || [];

        return stages;
    }

    @Watch("stageList", { immediate: true })
    onstageListChanged (list: {ID: number; name: string}[]) {
        if (list.length > 0)
            this.selectedStage = list[0]?.ID || 0;
    }

    get stage (): Stage | null {
        return this.tournament?.stages.find(s => s.ID === this.selectedStage) || null;
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
        margin-top: 20px;
        flex-direction: column;
        width: 75vw;
        position: relative;
        padding: 35px;
    }
}
</style>