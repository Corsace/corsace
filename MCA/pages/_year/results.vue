<template>
    <div>
        <div class="results-wrapper">
            <mode-switcher
                hidePhase
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
            :localKey="'results'"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Getter, Mutation, State, namespace } from "vuex-class";
import { vueWindowSizeMixin } from 'vue-window-size';

import ModeSwitcher from "../../../MCA-AYIM/components/ModeSwitcher.vue";
import NoticeModal from "../../../MCA-AYIM/components/NoticeModal.vue"
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
        StagePageList
    },
    head () {
        return {
            title: `${this.$route.params.year} results | MCA`,
        };
    }
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

    // label must match a field in BOTH assets/lang/{lang}/mca.results.*
    //   AND a property of either BeatmapResults or UserResults 
    columns: ResultColumn[] = [
        {label: "placement", size: 1.5, category: "beatmaps", prio: true}, 
        {label: "placement", size: 4, category: "users", prio: true},
        {label: "map", size: 6, category: "beatmaps", mobileOnly: true},
        {label: "title", size: 6, category: "beatmaps", desktopOnly: true},
        {label: "artist", size: 4, category: "beatmaps", desktopOnly: true},
        {label: "hoster", size: 2.25, category: "beatmaps", desktopOnly: true},
        {label: "username", size: 10.25, msize: 6, category: "users"},
        {label: "firstChoice", size: 1.5, desktopOnly: true, centred: true},
        {label: "totalVotes", size: 1.5, centred: true, prio: true},
        {name: "vr", size: 0.5},
    ]

    // filter columns by breakpoint and category
    get filtCol() {
        return this.columns.filter(
            c => (!c.category || c.category === this.section) &&
            ((c.mobileOnly && this.mobile) || 
             (c.desktopOnly && !this.mobile) ||
             (!c.mobileOnly && !c.desktopOnly))
        );
    }

    get mobile(): Boolean {
        return vueWindowSizeMixin.computed.windowWidth() < 768;
    }

    mounted () {
        if (!(this.phase?.phase === 'results' || this.isMCAStaff)) {
            this.$router.push("/"+this.$route.params.year);
            return;
        }
        
        this.updateStage("results")
        this.reset();
        this.updateSection("beatmaps");
        this.setInitialData();
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
        padding-top: 50px;
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