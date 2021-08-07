<template>
    <div>
        <div class="results-wrapper">
            <mode-switcher
                hide-phase
                hide-title
                force-no-scroll
                :title="$t(`mca.main.results`)"
            >
                <div class="results-general"> 
                    <results-filters />
                    <results-table-headings 
                        :section="section"
                        :columns="filtCol"
                        :mobile="mobile"
                    />
                    <hr class="table-border">
                    <stage-page-list 
                        results
                        class="results-table"
                        :columns="filtCol"
                        :mobile="mobile"
                    />
                </div>
            </mode-switcher>
        </div>

        <notice-modal
            v-if="phase && phase.phase === 'results'"
            :title="$t('mca.main.results')"
            :text="$t('mca.results.resultsOverlay')"
            :local-key="'results'"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { Getter, Mutation, State, namespace } from "vuex-class";

import ModeSwitcher from "../../../MCA-AYIM/components/ModeSwitcher.vue";
import NoticeModal from "../../../MCA-AYIM/components/NoticeModal.vue";
import ResultsFilters from "../../components/results/ResultsFilters.vue";
import ResultsTableHeadings from "../../components/results/ResultsTableHeadings.vue";
import StagePageList from "../../components/stage/StagePageList.vue";

import { MCAInfo, Phase } from "../../../Interfaces/mca";
import { SectionCategory, StageType } from "../../../MCA-AYIM/store/stage";
import { ResultColumn } from "../../../Interfaces/result";

const stageModule = namespace("stage");

@Component({
    components: {
        ModeSwitcher,
        NoticeModal,
        ResultsFilters,
        ResultsTableHeadings,
        StagePageList,
    },
    head () {
        return {
            title: `Results | MCA ${this.$route.params.year ?? (new Date()).getUTCFullYear()}`,
            meta: [
                { hid: "description", name: "description", content: `The results for the osu!-related awards event for mappers for the ${this.$route.params.year ?? (new Date()).getUTCFullYear()} year.` },
                { hid: "og:title", property: "og:title", content: `Results | MCA ${this.$route.params.year ?? (new Date()).getUTCFullYear()}` },
                { hid: "og:type", property: "og:type", content: "website" },
                { hid: "og:url", property: "og:url", content: "https://mca.corsace.io" },
                { hid: "og:description", property: "og:description", content: `The results for the osu!-related awards event for mappers for the ${this.$route.params.year ?? (new Date()).getUTCFullYear()} year.` },
                { hid: "og:site_name", property: "og:site_name", content: "MCA" },
                { hid: "theme-color", name: "theme-color", content: "#fb2475" },
            ],
        };
    },
})

export default class Results extends Vue {
    @State allMCA!: MCAInfo[];

    @Getter phase!: Phase | undefined;
    @Getter isMCAStaff!: boolean;

    @Mutation toggleGuestDifficultyModal;

    @stageModule.State section!: SectionCategory;
    @stageModule.State stage!: StageType;

    @stageModule.Action reset;
    @stageModule.Action updateSelectedCategory;
    @stageModule.Action updateSection;
    @stageModule.Action updateStage;
    @stageModule.Action setInitialData;

    windowWidth = -1;
    mobile = false;

    @Watch("windowWidth")
    onWindowWidthChanged (newWidth: number) {
        this.mobile = newWidth < 768;
    } 

    // label must match a field in BOTH assets/lang/{lang}/mca.results.headings.*
    //   AND a property of either BeatmapResults or UserResults 
    columns: ResultColumn[] = [
        {label: "placement", size: 1.5, category: "beatmaps", prio: true}, 
        {label: "placement", size: 4, category: "users", prio: true},
        {label: "map", size: 6, category: "beatmaps", mobileOnly: true},
        {label: "title", size: 6, category: "beatmaps", desktopOnly: true},
        {label: "artist", size: 4, category: "beatmaps", desktopOnly: true},
        {label: "hoster", size: 2.25, category: "beatmaps", desktopOnly: true},
        {label: "username", size: 9.75, msize: 6, category: "users"},
        {label: "firstChoice", size: 1.5, centred: true, prio: true},
        {label: "secondThirdChoice", size: 1.5, desktopOnly: true, centred: true},
        {label: "restChoice", size: 1.5, desktopOnly: true, centred: true},
    ]

    // filter columns by breakpoint and category
    get filtCol () {
        return this.columns.filter(
            c => (!c.category || c.category === this.section) &&
            ((c.mobileOnly && this.mobile) || 
             (c.desktopOnly && !this.mobile) ||
             (!c.mobileOnly && !c.desktopOnly))
        );
    }

    mounted () {
        if (!(this.phase?.phase === "results" || this.isMCAStaff)) {
            this.$router.push("/" + this.$route.params.year);
            return;
        }
        
        this.updateStage("results");
        this.reset();
        this.updateSection("beatmaps");
        this.setInitialData();
        if (process.client) {
            window.addEventListener("resize", this.handleWindowResize);
            this.handleWindowResize();
        }
    }

    beforeDestroy () {
        if (process.client) {
            window.removeEventListener("resize", this.handleWindowResize);
        }
    }

    handleWindowResize () {
        if (process.client) {
            this.windowWidth = window.innerWidth;
        }
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.results-wrapper {
    width: 100%;
    max-height: 100%;
    padding-top: 10px;

    @include breakpoint(laptop) {
        padding-top: 25px;
        height: 100%;
    }
}

.results-general {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.table-border {
    flex: initial;
    margin: 0 5px 15px 5px;
    border-top: 1px white;        
}

.results-table {
    padding: 0 5px 0 5px;
    overflow: hidden;
}

.no-results {
    @extend %flex-box;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    height: 100%;

    font-size: 2rem;
}
</style>