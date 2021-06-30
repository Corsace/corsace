<template>
    <div class="results-wrapper">
        <mode-switcher
            enable-mode-eligibility
            :hidePhase="true"
            :title="phase.phase === 'results' ? 'results' : ''"
            @inactiveModeClicked="toggleGuestDifficultyModal"
        >
            <div
                v-if="phase.phase === 'results'"
                class="results-general"
            > 
                <results-filters />

                <span 
                    v-if="section === 'beatmaps'"
                    class="table-headings"
                >
                    <span class="table-headings__mapplace">PLACE</span>
                    <span class="table-headings__map">MAP</span>
                    <span class="table-headings__title">TITLE</span>
                    <span class="table-headings__artist">ARTIST</span>
                    <span class="table-headings__host">HOST</span>
                    <span class="table-headings__votes">VOTES</span>
                    <span class="table-headings__vote-right" />
                </span>
                
                <span
                    v-else
                    class="table-headings"
                >
                    <span class="table-headings__userplace">PLACE</span>
                    <span class="table-headings__user">USER</span>
                    <span class="table-headings__votes">VOTES</span>
                    <span class="table-headings__vote-right" />
                </span>

                <hr class="table-border">
                
                <stage-page-list 
                    :results="true"
                    class="results-table"
                />
            </div>

            <div
                v-else
                class="no-results"
            >
                There are no MCA results for {{ $route.params.year }}. Check back later!
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

import _ from "lodash";

const stageModule = namespace("stage");

@Component({
    components: {
        ModeSwitcher,
        ResultsFilters,
        StagePageList
    },
    head () {
        return {
            title: `results ${this.$route.params.year} | MCA`,
        };
    }
})
export default class Results extends Vue {
    @Getter phase!: Phase | null;
    @State allMCA!: MCAInfo[];
    @stageModule.State stage!: StageType;
    @Mutation toggleGuestDifficultyModal;
    @stageModule.State section!: SectionCategory;
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