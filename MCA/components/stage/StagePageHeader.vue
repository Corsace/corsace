<template>
    <div 
        class="category-header"
        :class="`category-header--${selectedMode}`"
    >
        <div class="category-header__shapes">
            <div 
                class="category-header__shape--large"
                :class="`category-header__shape--${selectedMode}`"
            />
            <div 
                class="category-header__shape--small"
                :class="`category-header__shape--${selectedMode}`"
            />
            <div 
                class="category-header__shape--small2"
                :class="`category-header__shape--${selectedMode}`"
            />
        </div>
        <template v-if="selectedCategory">
            <div class="category-header__title">
                {{ ($t(`mca.categories.${selectedCategory.name}.name`)) }}
            </div>
            <div class="category-header__desc">
                {{ $t(`mca.categories.${selectedCategory.name}.description`) + (selectedCategory.isFiltered ? " (auto filter enabled)" : "") }}
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace, State } from "vuex-class";

import { CategoryStageInfo } from "../../../Interfaces/category";

const stageModule = namespace("stage");

@Component
export default class StateContent extends Vue {

    @State selectedMode!: string;
    @stageModule.State selectedCategory!: CategoryStageInfo | null;

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

@mixin mode-category__shapes {
    @each $mode in $modes {
        &--#{$mode} {
            background-color: var(--#{$mode});
        }
    }
}

.category-header {
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

    &__title {
        font-weight: bold;
        font-size: 2rem;
        text-transform: uppercase;

        @include breakpoint(tablet) {
            font-size: 1.9rem;
        }
        @include breakpoint(laptop) {
            font-size: 1.46rem;
        }
        @include breakpoint(desktop) {
            font-size: 2.16rem;
        }

        grid-column: 2;
        justify-self: end;
        align-self: end;

        padding-bottom: 5px;

        @include breakpoint(mobile) {
            grid-column: 1;
            justify-self: center;
            align-self: center;
        }

        @include transition;
    }

    &__desc {
        font-size: $font-sm;
        @include breakpoint(tablet) {
            font-size: $font-base;
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

    &__shapes {
        display: none;
        background-color: #242424;

        position: relative;

        grid-row: 1 / 3;
        width: 206px;

        @include breakpoint(tablet) {
            display: block;
        }
    }

    &__shape {
        @include mode-category__shapes;

        &--large, &--small, &--small2 {
            transform: rotate(45deg);

            position: absolute;

            @include transition;
        }

        &--small, &--small2 {
            height: 150px;
            width: 23px;
        }

        &--large {
            height: 300px;
            width: 300px;

            right: 30%;
            top: -200%;
        }

        &--small {
            right: 31%;
            top: 20%;
        }

        &--small2 {
            right: 5%;
            top: 4%;
        }
    }
}

</style>
