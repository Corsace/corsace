<template>
    <div class="stage">
        <stage-page-categories />
        
        <div class="category__count-container">
            <div class="category__count">
                <div class="category__count-number">
                    {{ count }}
                </div>
                <div class="category__count-divider" />
                <div 
                    class="category__count-candidates"
                    :class="`category__count-candidates--${selectedMode}`"
                >
                    {{ $t('mca.nom_vote.candidates') }}
                </div>
            </div>
        </div>
        <div class="category__general">
            <div 
                class="category__head"
                :class="`category__head--${selectedMode}`"
            >
                <div class="category__head-shapes">
                    <div 
                        class="category__head-shape-large"
                        :class="`category__head-shape--${selectedMode}`"
                    />
                    <div 
                        class="category__head-shape-small"
                        :class="`category__head-shape--${selectedMode}`"
                    />
                    <div 
                        class="category__head-shape-small2"
                        :class="`category__head-shape--${selectedMode}`"
                    />
                </div>
                <template v-if="selectedCategory">
                    <div class="category__head-title">
                        {{ ($t(`mca.categories.${selectedCategory.name}.name`)).toUpperCase() }}
                    </div>
                    <div class="category__head-desc">
                        {{ $t(`mca.categories.${selectedCategory.name}.description`) + (selectedCategory.isFiltered ? " (auto filter enabled)" : "") }}
                    </div>
                </template>
            </div>
            
            <stage-page-list />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { namespace, State } from "vuex-class";

import StagePageCategories from "./StagePageCategories.vue";
import StagePageList from "./StagePageList.vue";

import { CategoryStageInfo } from "../../../Interfaces/category";

const stageModule = namespace("stage");

@Component({
    components: {
        StagePageCategories,
        StagePageList,
    },
})
export default class StateContent extends Vue {

    @State selectedMode!: string;
    @stageModule.State count!: number;
    @stageModule.State selectedCategory!: CategoryStageInfo | null;
    @stageModule.Action updateStage;
    @stageModule.Action setInitialData;
    @stageModule.Action reset;

    @Watch("selectedMode")
    onSelectedModeChange () {
        this.reset();
    }

    async mounted () {
        if (/^(nominating|nominate)$/.test(this.$route.params.stage))
            this.updateStage("nominating");
        else if (/^(vote|voting)$/.test(this.$route.params.stage))
            this.updateStage("voting");

        await this.setInitialData();
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

@mixin mode-category__candidates {
    @each $mode in $modes {
        &--#{$mode} {
            border: 1px solid var(--#{$mode});
            border-left: 0;
        }
    }
}

@mixin mode-category__shapes {
    @each $mode in $modes {
        &--#{$mode} {
            background-color: var(--#{$mode});
        }
    }
}

.stage {
    display: flex;
    flex-wrap: wrap;
    height: 100%;
}

.stage__categories {
    flex: 1 1 15%;
}

.category__count {
    margin-left: 5px;
    margin-right: 10px;
    flex: 0;
    display: flex;
    flex-direction: column;

    align-items: center;
    justify-content: space-evenly;
    height: 100%;

    @include breakpoint(laptop) {
        flex-direction: row;
        height: fit-content;
    }

    position: relative;

    &-number {
        font-family: $font-scoreboard;
        font-size: 2.25rem;
        line-height: 95px;
        text-align: center;
        background-color: rgba(0,0,0,0.6);

        border: 4px solid;
        border-radius: 50%;
        
        width: 100px;
        height: 100px;
    }

    &-divider {
        border: 2px solid white;
        position: absolute;
        left: 47.5px;
        bottom: -349px;
        height: 350px;
        width: 5px;
        border-bottom: none;
        box-shadow: 0 0 2px white;

        display: none;
        
        @include breakpoint(laptop) {
            display: block;
        }
    }

    &-candidates {
        padding: 6px;
        background-color: white;
        border-radius: 25px;
        
        @include breakpoint(laptop) {
            border-radius: 0 25px 25px 0;
            position: absolute;
            left: 97%;
        }

        font-size: 1.2rem;
        line-height: 0.7;

        @include mode-text-color;
        @include transition;
    }

}

.category__general {
    flex: 3 1 100%;
    display: flex;
    flex-direction: column;
    height: 100%;

    @include breakpoint(laptop) {
        flex: 3 1 50%;
    }
}

.category__head {
    background-color: white;
    border-radius: 5.5px 0 0 5.5px;
    box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.63);

    display: grid;
    width: 100%;
    height: auto;
    min-height: 80px;
    position: relative;
    padding-right: 3%;
    line-height: 0.9;
    overflow: hidden;
    z-index: -1;

    @include breakpoint(mobile) {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    @include mode-text-color;

    &-title {
        font-weight: bold;
        font-size: 2rem;
        @include breakpoint(tablet) {
            font-size: 3.6rem;
        }
        @include breakpoint(laptop) {
            font-size: 2.5rem;
        }
        @include breakpoint(desktop) {
            font-size: 4.1rem;
        }

        grid-column: 2;
        justify-self: end;
        align-self: end;

        @include breakpoint(mobile) {
            grid-column: 1;
            justify-self: center;
            align-self: center;
        }

        @include transition;
    }

    &-desc {
        font-size: $font-base;
        @include breakpoint(tablet) {
            font-size: $font-lg;
        }
        font-style: italic;

        grid-column: 2;
        justify-self: end;
        @include breakpoint(mobile) {
            grid-column: 1;
            justify-self: center;
            align-self: center;
        }
        @include transition;
    }

    &-shapes {
        background-color: #242424;

        position: relative;

        grid-row: 1 / 3;
        width: 206px;

        @include breakpoint(mobile) {
            display: none;
        }
    }

    &-shape {
        @include mode-category__shapes;

        &-large, &-small, &-small2 {
            transform: rotate(45deg);

            position: absolute;

            @include transition;
        }

        &-small, &-small2 {
            height: 150px;
            width: 23px;
        }

        &-large {
            height: 300px;
            width: 300px;

            right: 30%;
            top: -200%;
        }

        &-small {
            right: 31%;
            top: 20%;
        }

        &-small2 {
            right: 5%;
            top: 4%;
        }
    }
}

.category__selection {
    width: 100%;
    height: 100vh;
    @include breakpoint(tablet) {
        height: 45vh;
    }

    &-search {
        padding: 15px 0;
    }

    &-area {
        height: 100%;
        position: relative;
    }

    &-maps {
        @extend %spaced-container;
        align-content: flex-start;
        justify-content: initial;
        height: 100%;
        overflow-y: scroll;
        margin-right: 50px; // Space for scrollbar
        margin-top: 0;
        margin-bottom: 0;
        position: relative;

        mask-image: linear-gradient(to top, transparent 10%, black 25%);
        @include breakpoint(tablet) {
            mask-image: linear-gradient(to top, transparent 25%, black 50%);
        }
        @include breakpoint(laptop) {
            mask-image: linear-gradient(to top, transparent 0%, black 25%);
        }

        &::-webkit-scrollbar {
            display: none;
        }
    }
}
</style>
