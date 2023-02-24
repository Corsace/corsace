<template>
    <div 
        v-if="selectedMode"
        class="modeHeader"
        :class="`modeHeader--${viewTheme}`"
    >
        {{ selectedMode.toUpperCase() }}
        <div 
            class="modeHeader--background"
            :class="`modeHeader--${selectedMode}`"
        >
            <div class="modeHeader--scroller">
                <div
                    v-for="i in 10"
                    :key="i"
                >
                    {{ selectedMode.toUpperCase() }} {{ selectedMode.toUpperCase() }} {{ selectedMode.toUpperCase() }} {{ selectedMode.toUpperCase() }}
                </div>
            </div>
            <div 
                :class="[
                    `modeHeader--icon-${selectedMode}`,
                    `modeHeader--icon-${selectedMode}-${viewTheme}`
                ]"
            >
                <img
                    :src="require(`../../img/site/mca-ayim/mode/${selectedMode}.svg`)"
                >
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

const mcaAyimModule = namespace("mca-ayim");

@Component
export default class ModeHeader extends Vue {

    @State viewTheme!: "light" | "dark";

    @mcaAyimModule.State selectedMode!: string;

}
</script>

<style lang="scss">
@use "sass:math";
@import '@s-sass/_mixins';
@import '@s-sass/_variables'; 

$scroll-size: 8rem;
$scroll-rotate: 10deg;

@keyframes modeScroll {
    from {
        top: calc(-1 * $scroll-size * math.cos($scroll-rotate));
        left: 8 * calc($scroll-size * math.sin($scroll-rotate));
    }
    to {
        top: 2 * calc(-1 * $scroll-size * math.cos($scroll-rotate));
        left: 9 * calc($scroll-size * math.sin($scroll-rotate));
    }
}

.modeHeader {
    min-height: 40px;
    @include breakpoint(laptop) {
        min-height: 65px;
    }
    width: 100%;
    padding: 10px;
    border: 1px $blue solid;

    font-weight: bold;
    font-size: $font-xl;
    font-family: $font-book;
    
    overflow: hidden;

    display: flex;
    justify-content: space-between;
    align-items: center;
    @include breakpoint(mobile) {
        display: none;
    }
    @include breakpoint(tablet) {
        font-size: $font-xxl;
    }
    @include breakpoint(laptop) {
        font-size: $font-xxl;
    }
    @include breakpoint(desktop) {
        font-size: $font-xxxl;
    }

    &--light {
        background-color: white;
        color: black;
    }
    &--dark {
        background-color: $dark;
        color: white;
    }

    @each $mode in $modes {
        &--#{$mode} {
            color: var(--#{$mode});
        }
    }
    &--background {
        position: relative;
        width: 100%;
    }
    &--scroller {
        position: absolute;
        transform: rotate($scroll-rotate);
        font-size: $scroll-size;
        line-height: $scroll-size;
        white-space: nowrap;

        display: none;
        @include breakpoint(laptop) {
            display: initial;
        }

        animation-name: modeScroll;
        animation-duration: 4s;
        animation-iteration-count: infinite;
        animation-timing-function: linear;
    }
    &--icon {
        @each $mode in $modes {
            &-#{$mode} {
                background-color: var(--#{$mode});

                position: absolute;
                @include breakpoint(mobile) {
                    transform: scale(12) rotate($scroll-rotate);
                }
                transform: scale(9) rotate($scroll-rotate);
                @include breakpoint(tablet) {
                    transform: scale(8) rotate($scroll-rotate);
                }
                @include breakpoint(laptop) {
                    transform: scale(6) rotate($scroll-rotate);
                }

                width: 10%;
                right: 5%;

                display: flex;
                justify-content: center;
                align-items: center;

                &-light {
                    & img {
                        filter: invert(1);
                    }
                }

                & img {
                    width: 33%;
                }
            }
        }
    }
}
</style>