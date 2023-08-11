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
                @click="page = 'scores'; $store.dispatch('open/setQualifierScores', tournament?.ID);"
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
                            :not-beginning="selectedMappool?.ID !== mappoolList[0]?.ID"
                            :not-end="selectedMappool?.ID !== mappoolList[mappoolList.length - 1]?.ID"
                            @prev="index--"
                            @next="index++"
                        >
                            <template #top_text>
                                {{ $t("open.components.stageSelector.stage") }}
                            </template>
                            <template #bottom_text>
                                {{ $t("open.components.stageSelector.select") }}
                            </template>

                            <template #stage>
                                {{ selectedMappool?.abbreviation.toUpperCase() || '' }}
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
                            :href="selectedMappool?.mappackLink || ''"
                            class="qualifiers__button"
                        >
                            <div class="qualifiers__button_text">
                                {{ $t('open.qualifiers.mappool.mappool') }}
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
                        <div class="qualifiers__header_subtext">
                            <span>{{ $t('open.qualifiers.scores.category') }}</span>
                            <span>{{ $t('open.qualifiers.scores.select') }}</span>
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
            <MappoolView
                v-if="selectedMappool?.isPublic"
                :pool="selectedMappool"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component} from "vue-property-decorator";
import { namespace } from "vuex-class";

import MappoolView from "../../Assets/components/open/MappoolView.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import StageSelector from "../../Assets/components/open/StageSelector.vue";

import { Tournament } from "../../Interfaces/tournament";
import { Mappool as MappoolInterface } from "../../Interfaces/mappool";

const openModule = namespace("open");

@Component({
    components: {
        StageSelector,
        MappoolView,
        OpenTitle,
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
    page: "mappool" | "scores" = "mappool";
    scoreView: "players" | "teams" = "teams";

    @openModule.State tournament!: Tournament | null;

    mappoolList: MappoolInterface[] = [];
    index = 0;
    
    get selectedMappool (): MappoolInterface | null {
        return this.mappoolList[this.index] || null;
    }

    mounted () {
        this.mappoolList = this.tournament?.stages.flatMap(s => [...s.mappool, ...s.rounds.flatMap(r => r.mappool)]) || [];
        this.index = this.mappoolList.findLastIndex(m => m.isPublic);
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