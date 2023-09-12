<template>
    <div class="mappool">
        <div class="qualifiers__sub_header">
            <div
                class="qualifiers__sub_header_item"
                :class="{ 'qualifiers__sub_header_item--active': page === 'mappool' }"
                @click="page = 'mappool'"
            >
                {{ $t('open.qualifiers.nav.mappool') }}
            </div>
            <div
                class="qualifiers__sub_header_item"
                :class="{ 'qualifiers__sub_header_item--active': page === 'scores' }"
                @click="page = 'scores'"
            >
                {{ $t('open.qualifiers.nav.scores') }}
            </div>
        </div>
        <div class="mappool__main_content">
            <OpenTitle>
                {{ $t('open.mappool.title') }}
                <template #buttons>
                    <div
                        v-if="page === 'mappool'"
                        class="qualifiers__button_group"
                    >
                        <StageSelector
                            :not-beginning="selectedStage?.ID !== stageList[0]?.ID"
                            :not-end="selectedStage?.ID !== stageList[stageList.length - 1]?.ID"
                            @prev="index--"
                            @next="index++"
                        >
                            <template #text>
                                {{ $t("open.components.stageSelector") }}
                            </template>

                            <template #stage>
                                {{ selectedStage?.abbreviation.toUpperCase() || '' }}
                            </template>
                        </StageSelector>
                        <!-- TODO: NOT MAKE THIS A STATIC LINK LOL -->
                        <a 
                            href="https://docs.google.com/spreadsheets/d/1NvbsvI3aa-UHdenu22zDCyoto6lqM8rPri_XZ8fCMds/edit?usp=sharing"
                            class="qualifiers__button"
                        >
                            <div class="qualifiers__button_text">
                                {{ $t('open.qualifiers.mappool.sheets') }}
                            </div>
                            <img 
                                class="qualifiers__button_ico" 
                                src="../../Assets/img/site/open/mappool/sheets-ico.svg"
                            >
                        </a>
                        <a
                            v-for="mappool in mappools"
                            :key="mappool.ID"
                            :href="mappool.mappackLink || ''"
                            class="qualifiers__button"
                        >
                            <div class="qualifiers__button_text">
                                {{ $t('open.qualifiers.mappool.mappool') }} - {{ mappool.abbreviation.toUpperCase() }}
                            </div>
                            <img 
                                class="qualifiers__button_ico"
                                src="../../Assets/img/site/open/mappool/dl-ico.svg"
                            >
                        </a>
                    </div>
                    <div
                        v-if="page === 'scores'"
                        class="qualifiers__button_group"
                    >
                        <StageSelector
                            :not-beginning="selectedStage?.ID !== stageList[0]?.ID"
                            :not-end="selectedStage?.ID !== stageList[stageList.length - 1]?.ID"
                            @prev="index--"
                            @next="index++"
                        >
                            {{ $t("open.components.stageSelector") }}

                            <template #stage>
                                {{ selectedStage?.abbreviation.toUpperCase() || '' }}
                            </template>
                        </StageSelector>
                        <div class="qualifiers__header_subtext">
                            {{ $t('open.qualifiers.scores.categorySelect') }}
                        </div>
                        <ContentButton 
                            class="content_button--header_button"
                            :class="{
                                'content_button--red': scoreView === 'players',
                                'content_button--red_outline': scoreView !== 'players',
                            }"
                            @click.native="scoreView = 'players'"
                        >
                            {{ $t('open.qualifiers.scores.players') }}
                        </ContentButton>
                        <ContentButton 
                            class="content_button--header_button"
                            :class="{
                                'content_button--red': scoreView === 'teams',
                                'content_button--red_outline': scoreView !== 'teams',
                            }"
                            @click.native="scoreView = 'teams'"
                        >
                            {{ $t('open.qualifiers.scores.teams') }}
                        </ContentButton>
                    </div>
                </template>
            </OpenTitle>
            <div v-if="page === 'mappool' && mappools?.length !== 0">
                <MappoolView
                    v-for="mappool in mappools"
                    :key="mappool.ID"
                    :pool="mappool"
                />
            </div>
            <div
                v-else-if="page === 'mappool'"
                class="qualifiers__button_group"
            >
                {{ $t("open.qualifiers.mappool.notAvailable") }}
            </div>
            <div v-if="page === 'scores'">
                <!-- TODO: Actually support multiple pools -->
                <ScoresView
                    v-for="mappool in mappools"
                    :key="mappool.ID"
                    :view="scoreView"
                    :pool="mappool"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch} from "vue-property-decorator";
import { namespace } from "vuex-class";

import MappoolView from "../../Assets/components/open/MappoolView.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import StageSelector from "../../Assets/components/open/StageSelector.vue";

import { Tournament } from "../../Interfaces/tournament";
import { Mappool as MappoolInterface } from "../../Interfaces/mappool";

import OpenButton from "../../Assets/components/open/OpenButton.vue";
import ContentButton from "../../Assets/components/open/ContentButton.vue";
import ScoresView from "../../Assets/components/open/ScoresView.vue";
import { Stage } from "../../Interfaces/stage";

const openModule = namespace("open");

@Component({
    components: {
        StageSelector,
        MappoolView,
        OpenTitle,
        OpenButton,
        ContentButton,
        ScoresView,
    },
    head () {
        return {
            title: this.$store.state.open.title,
            meta: [
                {hid: "description", name: "description", content: this.$store.state.open.tournament.description},

                {hid: "og:site_name", property: "og:site_name", content: this.$store.state.open.title},
                {hid: "og:title", property: "og:title", content: this.$store.state.open.title},
                {hid: "og:url", property: "og:url", content: `https://open.corsace.io${this.$route.path}`}, 
                {hid: "og:description", property: "og:description", content: this.$store.state.open.tournament.description},
                {hid: "og:image",property: "og:image", content: require("../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state.open.title},
                {name: "twitter:description", content: this.$store.state.open.tournament.description},
                {name: "twitter:image", content: require("../../Assets/img/site/open/banner.png")},
                {name: "twitter:image:src", content: require("../../Assets/img/site/open/banner.png")},
            ],
            link: [{rel: "canonical", hid: "canonical", href: `https://open.corsace.io${this.$route.path}`}],
        };
    },
})
export default class Mappool extends Vue {
    page: "mappool" | "scores" = "mappool";
    scoreView: "players" | "teams" = "teams";

    @openModule.State tournament!: Tournament | null;
    @openModule.State mappools!: MappoolInterface[] | null;

    stageList: Stage[] = [];
    index = 0;
    
    get selectedStage (): Stage | null {
        return this.stageList[this.index] || null;
    }

    @Watch("selectedStage")
    async stageScoresAndMappools () {
        if (!this.selectedStage) {
            this.$store.commit("open/setMappools", []);
            this.$store.commit("open/setScores", []);
            return;
        }
        
        const ID = this.selectedStage.ID;
        this.$store.commit("open/setMappools", []);
        this.$store.commit("open/setScores", []);

        await this.pause(500);
        if (ID !== this.selectedStage.ID) return;

        await this.$store.dispatch("open/setMappools", this.selectedStage?.ID);
        await this.$store.dispatch("open/setScores", this.selectedStage?.ID);
    }

    async pause (ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    mounted () {
        this.stageList = this.tournament?.stages || [];
        this.index = this.stageList.findIndex(s => s.timespan.end > new Date());
        if (this.index === -1)
            this.index = 0;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
.mappool {
    background: linear-gradient(180deg, #1F1F1F 0%, #131313 100%);
    overflow: auto;

    &__main_content {
        align-self: center;
        position: relative;
        width: 65vw;
        padding: 35px;
        background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
    }
}
</style>