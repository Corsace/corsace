<template>
    <div 
        v-if="selectedCategory"
        class="category-header"
        :class="`category-header--${selectedMode}`"
    >
        <div 
            class="category-header__stage"
            :class="`category-header__stage--${viewTheme}`"
        >
            {{ stage }}
        </div>
        
        <div 
            class="category-header__info"
            :class="`category-header__info--${viewTheme}`"
        >
            <div class="category-header__title">
                {{ ($t(`mca.categories.${selectedCategory.name}.name`)) }}
            </div>
            <div class="category-header__desc">
                {{ $t(`mca.categories.${selectedCategory.name}.description`) + (selectedCategory.isFiltered ? " (auto filter enabled)" : "") }}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace, State } from "vuex-class";

import { CategoryStageInfo } from "../../../Interfaces/category";
import { StageType } from "../../../Interfaces/mca";

const mcaAyimModule = namespace("mca-ayim");
const stageModule = namespace("stage");

@Component
export default class StateContent extends Vue {

    @State viewTheme!: "light" | "dark";

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
        @include breakpoint(mobile) {
            font-size: $font-base;
        }
        letter-spacing: .25rem;
        color: white;
        text-align: center;
        text-transform: uppercase;

        &--light {
            color: white;
        }
        &--dark {
            color: black;
        }
    }

    &__info {
        display: flex;
        background-color: white;
        height: 100%;
        width: 100%;
        
        @include breakpoint(mobile) {
            flex-direction: column;
        }

        &--light {
            background-color: white;
            color: black;
        }
        &--dark {
            background-color: $dark;
            color: white;
        }
    }

    &__title {
        display: flex;
        align-items: center;
        height: 100%;

        padding: 10px 40px 10px 20px;

        font-weight: bold;
        font-size: $font-xl;
        font-family: $font-book;
        text-transform: uppercase;

        @include breakpoint(mobile) {
            padding: 15px 0;
            font-size: $font-xl;
            grid-column: 1;
            justify-self: center;
            align-self: center;
        }
        @include breakpoint(tablet) {
            padding: 15px 40px 15px 20px;
            font-size: $font-xxl;
        }
        @include breakpoint(laptop) {
            padding: 20px 40px 20px 20px;
            font-size: $font-xxl;
        }
        @include breakpoint(desktop) {
            padding: 30px 40px 30px 20px;
            font-size: $font-xxxl;
        }
    }

    &__desc {
        flex: 1;
        display: flex;
        align-items: center;
        padding-left: 40px;
        padding-right: 40px;

        height: 100%;
        width: 100%;
        font-size: $font-lg;
        color: white;
        background-color: var(--selected-mode);

        clip-path: polygon(84% 0, 100% 18%, 100% 100%, 0 100%, 1% 0);
        @include breakpoint(mobile) {
            font-size: $font-base;
            clip-path: none;
            justify-content: center;
        }

        @include breakpoint(tablet) {
            font-size: $font-xl;
        }
    }
}
</style>
