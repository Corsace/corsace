<template>
    <div 
        class="category-header"
        :class="`category-header--${selectedMode}`"
    >
        <div class="category-header__stage">
            {{ stage }}
        </div>
        
        <template v-if="selectedCategory">
            <div class="category-header__info">
                <div class="category-header__title">
                    {{ ($t(`mca.categories.${selectedCategory.name}.name`)) }}
                </div>
                <div class="category-header__desc">
                    {{ $t(`mca.categories.${selectedCategory.name}.description`) + (selectedCategory.isFiltered ? " (auto filter enabled)" : "") }}
                </div>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";

import { CategoryStageInfo } from "../../../Interfaces/category";
import { StageType } from "../../../Interfaces/mca";

const mcaAyimModule = namespace("mca-ayim");
const stageModule = namespace("stage");

@Component
export default class StateContent extends Vue {

    @mcaAyimModule.State selectedMode!: string;

    @stageModule.State selectedCategory!: CategoryStageInfo | null;
    @stageModule.State stage!: StageType;

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.category-header {
    background-color: $blue;
    border: 2px solid $blue;

    display: flex;
    flex-direction: column;

    width: 100%;
    height: auto;
    min-height: 80px;

    @include breakpoint(mobile) {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    @include mode-text-color;

    &__stage {
        font-size: $font-lg;
        letter-spacing: .25rem;
        color: white;
        text-align: center;
        text-transform: uppercase;
    }

    &__info {
        display: flex;
        background-color: white;
        height: 100%;
        width: 100%;
        
        @include breakpoint(mobile) {
            flex-direction: column;
        }
    }

    &__title {
        display: flex;
        align-items: center;
        height: 100%;

        padding-left: 20px;
        padding-right: 40px;

        font-weight: bold;
        font-size: $font-xxxl;
        font-family: $font-book;
        text-transform: uppercase;
        color: #000;

        @include breakpoint(mobile) {
            grid-column: 1;
            justify-self: center;
            align-self: center;
        }

        @include transition;
    }

    &__desc {
        display: flex;
        align-items: center;
        padding-left: 40px;
        padding-right: 40px;

        height: 100%;
        width: 100%;
        font-size: $font-sm;
        color: white;
        background-color: var(--selected-mode);

        clip-path: polygon(84% 0, 100% 18%, 100% 100%, 0 100%, 1% 0);

        @include breakpoint(tablet) {
            font-size: $font-base;
        }

        @include transition;
    }
}
</style>
