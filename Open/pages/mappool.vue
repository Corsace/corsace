<template>
    <div class="mappool">
        <SubHeader
            :selections="[
                { text: $t('open.qualifiers.nav.mappool'), value: 'mappool' },
                { text: $t('open.qualifiers.nav.scores'), value: 'scores' },
            ]"
            :current-page="page"
            @update:page="changePage"
        />
        <div class="mappool__main_content">
            <OpenTitle>
                {{ $t('open.mappool.title') }}
                <template 
                    v-if="page === 'mappool'"
                    #right
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
                    <ContentButton
                        class="content_button--red"
                        :link="'https://docs.google.com/spreadsheets/d/1f2538nh9McAii15EJkHU18fi65ICQihxsmvTK-qhA0w'"
                        :img-src="require('../../Assets/img/site/open/mappool/sheets-ico.svg')"
                        external
                    >
                        {{ $t('open.qualifiers.mappool.sheets') }}
                    </ContentButton>
                    <ContentButton
                        v-for="mappool in mappools"
                        :key="mappool.ID"
                        class="content_button--red"
                        :link="mappool.mappackLink || ''"
                        :img-src="require('../../Assets/img/site/open/mappool/dl-ico.svg')"
                        external
                    >
                        {{ $t('open.qualifiers.mappool.mappool') }} - {{ mappool.abbreviation.toUpperCase() }}
                    </ContentButton>
                </template>
                <template
                    v-else-if="page === 'scores'"
                    #right
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
                </template>
            </OpenTitle>
            <div v-if="page === 'mappool' && mappools?.length !== 0">
                <MappoolView
                    v-for="mappool in mappools"
                    :key="mappool.ID"
                    :pool="mappool"
                />
            </div>
            <div v-else-if="page === 'mappool'">
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
import { Vue, Component, Watch } from "vue-property-decorator";
import { namespace } from "vuex-class";

import { Tournament } from "../../Interfaces/tournament";
import { Stage } from "../../Interfaces/stage";
import { Mappool as MappoolInterface } from "../../Interfaces/mappool";
import { MatchupScore } from "../../Interfaces/matchup";

import MappoolView from "../../Assets/components/open/MappoolView.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import ContentButton from "../../Assets/components/open/ContentButton.vue";
import StageSelector from "../../Assets/components/open/StageSelector.vue";
import ScoresView from "../../Assets/components/open/ScoresView.vue";
import SubHeader from "../../Assets/components/open/SubHeader.vue";

const openModule = namespace("open");

@Component({
    components: {
        StageSelector,
        MappoolView,
        OpenTitle,
        ContentButton,
        ScoresView,
        SubHeader,
    },
    head () {
        return {
            title: this.$store.state.open.title,
            meta: [
                {hid: "description", name: "description", content: this.$store.state.open.tournament?.description || ""},

                {hid: "og:site_name", property: "og:site_name", content: this.$store.state.open.title},
                {hid: "og:title", property: "og:title", content: this.$store.state.open.title},
                {hid: "og:url", property: "og:url", content: `https://open.corsace.io${this.$route.path}`}, 
                {hid: "og:description", property: "og:description", content: this.$store.state.open.tournament?.description || ""},
                {hid: "og:image",property: "og:image", content: require("../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state.open.title},
                {name: "twitter:description", content: this.$store.state.open.tournament?.description || ""},
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
    @openModule.State scores!: MatchupScore[] | null;

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
        if (this.page === "scores")
            await this.$store.dispatch("open/setScores", this.selectedStage?.ID);
    }

    async changePage (page: "mappool" | "scores") {
        if (page === this.page)
            return;
        if (page === "scores" && !this.selectedStage)
            return;
        if (page === "scores" && (!this.scores || this.scores.length === 0))
            await this.$store.dispatch("open/setScores", this.selectedStage?.ID);
        this.page = page;
    }

    async pause (ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    mounted () {
        this.stageList = this.tournament?.stages ?? [];
        this.index = this.stageList.findIndex(s => s.timespan.end > new Date());
        if (this.index === -1)
            this.index = this.stageList.length - 1;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
.mappool {
    overflow: auto;

    &__main_content {
        align-self: center;
        position: relative;
        width: 65vw;
        padding: 35px;
    }
}
</style>