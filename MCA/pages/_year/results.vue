<template>
    <div class="results-wrapper">
        <mode-switcher
<<<<<<< HEAD
            hidePhase
            :title="$t(`mca.main.results`)"
        >
            <div class="results-general"> 
=======
            enable-mode-eligibility
            :hidePhase="true"
            :title="phase.phase === 'results' ? 'results' : ''"
            @inactiveModeClicked="toggleGuestDifficultyModal"
        >
            <template v-if="phase.phase === 'results'"> 
>>>>>>> preliminary commit for results page
                <results-filters />

                <span 
                    v-if="section === 'beatmaps'"
                    class="table-headings"
                >
<<<<<<< HEAD
                    <span class="table-headings__mapplace">{{ $t('mca.results.place') }}</span>
                    <span class="table-headings__map">{{ $t('mca.results.map') }}</span>
                    <span class="table-headings__title">{{ $t('mca.results.title') }}</span>
                    <span class="table-headings__artist">{{ $t('mca.results.artist') }}</span>
                    <span class="table-headings__host">{{ $t('mca.results.host') }}</span>
                    <span class="table-headings__votes">{{ $t('mca.results.votes') }}</span>
=======
                    <span class="table-headings__mapplace">PLACE</span>
                    <span class="table-headings__map">MAP</span>
                    <span class="table-headings__title">TITLE</span>
                    <span class="table-headings__artist">ARTIST</span>
                    <span class="table-headings__host">HOST</span>
                    <span class="table-headings__votes">VOTES</span>
>>>>>>> preliminary commit for results page
                    <span class="table-headings__vote-right" />
                </span>
                
                <span
                    v-else
                    class="table-headings"
                >
<<<<<<< HEAD
                    <span class="table-headings__userplace">{{ $t('mca.results.place') }}</span>
                    <span class="table-headings__user">{{ $t('mca.results.user') }}</span>
                    <span class="table-headings__votes">{{ $t('mca.results.votes') }}</span>
=======
                    <span class="table-headings__userplace">PLACE</span>
                    <span class="table-headings__user">USER</span>
                    <span class="table-headings__votes">VOTES</span>
>>>>>>> preliminary commit for results page
                    <span class="table-headings__vote-right" />
                </span>

                <hr class="table-border">
                
<<<<<<< HEAD
                <stage-page-list 
                    results
                    class="results-table"
                />
=======
                <div class="results-table">
                    <stage-page-list :results="true" />
                </div>
            </template>

            <div
                v-else
                class="no-results"
            >
                There are no MCA results for {{ $route.params.year }}. Check back later!
>>>>>>> preliminary commit for results page
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

<<<<<<< HEAD
=======
import _ from "lodash";

>>>>>>> preliminary commit for results page
const stageModule = namespace("stage");

@Component({
    components: {
        ModeSwitcher,
        ResultsFilters,
        StagePageList
    },
    head () {
        return {
<<<<<<< HEAD
            title: `${this.$route.params.year} results | MCA`,
=======
            title: `results ${this.$route.params.year} | MCA`,
>>>>>>> preliminary commit for results page
        };
    }
})
export default class Results extends Vue {
<<<<<<< HEAD
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

=======
    @Getter phase!: Phase | null;
    @State allMCA!: MCAInfo[];
    @stageModule.State stage!: StageType;
    @Mutation toggleGuestDifficultyModal;
    @stageModule.State section!: SectionCategory;
>>>>>>> preliminary commit for results page
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

<<<<<<< HEAD
.results-general {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

=======
>>>>>>> preliminary commit for results page
.table-headings {
    padding: 0 5px 0 5px;

    font-size: 0.9rem;
    font-family: $font-body;
    text-transform: uppercase;

<<<<<<< HEAD
    flex: initial;
=======
>>>>>>> preliminary commit for results page
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
<<<<<<< HEAD
    flex: initial;
=======
>>>>>>> preliminary commit for results page
    margin: 0 5px 15px 5px;
    border-top: 1px white;        
}

.results-table {
    padding: 0 5px 0 5px;
<<<<<<< HEAD
    overflow: hidden;
=======
    height: calc(100% - 11rem);

    @include breakpoint(laptop) {
        height: calc(100% - 9rem);
    }

    @include breakpoint(desktop) {
        height: calc(100% - 6rem);
    }
>>>>>>> preliminary commit for results page
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