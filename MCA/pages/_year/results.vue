<template>
    <div class="results-wrapper">
        <mode-switcher
            hidePhase
            :title="$t(`mca.main.results`)"
        >
            <div class="results-general"> 
                <results-filters />

                <span 
                    v-if="section === 'beatmaps'"
                    class="table-headings"
                >
                    <span class="table-headings__mapplace">{{ $t('mca.results.place') }}</span>
                    <span class="table-headings__map">{{ $t('mca.results.map') }}</span>
                    <span class="table-headings__title">{{ $t('mca.results.title') }}</span>
                    <span class="table-headings__artist">{{ $t('mca.results.artist') }}</span>
                    <span class="table-headings__host">{{ $t('mca.results.host') }}</span>
                    <span class="table-headings__votes">{{ $t('mca.results.votes') }}</span>
                    <span class="table-headings__vote-right" />
                </span>
                
                <span
                    v-else
                    class="table-headings"
                >
                    <span class="table-headings__userplace">{{ $t('mca.results.place') }}</span>
                    <span class="table-headings__user">{{ $t('mca.results.user') }}</span>
                    <span class="table-headings__votes">{{ $t('mca.results.votes') }}</span>
                    <span class="table-headings__vote-right" />
                </span>

                <hr class="table-border">
                
                <stage-page-list 
                    results
                    class="results-table"
                />
            </div>
        </mode-switcher>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Getter, Mutation, State, namespace } from "vuex-class";

import ModeSwitcher from "../../../MCA-AYIM/components/ModeSwitcher.vue";
import ResultsFilters from "../../components/results/ResultsFilters.vue";
import StagePageList from "../../components/stage/StagePageList.vue";

import { MCAInfo, Phase } from "../../../Interfaces/mca";
import { SectionCategory, StageType } from "../../../MCA-AYIM/store/stage";

const stageModule = namespace("stage");

@Component({
    components: {
        ModeSwitcher,
        ResultsFilters,
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
    padding-top: 50px;

    @include breakpoint(laptop) {
        height: 100%;
    }
}

.results-general {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.table-headings {
    padding: 0 5px 0 5px;

    font-size: 0.9rem;
    font-family: $font-body;
    text-transform: uppercase;

    flex: initial;
    display: flex;

    &__mapplace {
        flex: 2;
        margin-right: 15px;
    }

    &__userplace {
        flex: 4;
        margin-right: 15px;
    }

    &__map {
        display: inline;
        flex: 11;

        @include breakpoint(tablet) {
            display: none;
        }
    }

    &__title {
        display: none;

        @include breakpoint(tablet) {
            display: inline;
            flex: 6;
        }
    }

    &__artist {
        display: none;

        @include breakpoint(tablet) {
            display: inline;
            flex: 4;
        }
    }

    &__host {
        display: none;

        @include breakpoint(tablet) {
            display: inline;
            flex: 4;
        }
    }

    &__user {
        flex: 6;
        
        @include breakpoint(tablet) {
            flex: 12;
        }
    }

    &__votes {
        flex: 1.5;

        display: flex;
        justify-content: center;
    }

    &__vote-right {
        flex: 0.5;
        margin-right: 65px;
    }
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