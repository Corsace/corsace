<template>
    <div class="mode-wrapper">
        <div class="mode-title-container">
            <slot name="title" />
            <div class="mode-title">
                {{ selectedMode }} 
                <span v-if="!hidePhase && phase">| {{ $t(`mca_ayim.main.${phase.phase}`) }}</span>
                <span v-if="title">| {{ title }}</span>
            </div>
        </div>

        <div
            class="mode-container"
            :class="`mode-container--${selectedMode}`"
        >
            <slot />
        </div>
        <div
            class="mode-selection" 
            :class="`mode-selection--${selectedMode}`"
        >
            <div
                v-for="mode in modes"
                :key="mode"
                class="mode-selection__mode"
                :class="[
                    `mode-selection__mode--${mode}`,
                    (selectedMode === mode) ? `mode-selection__mode--${mode}-selected` : '',
                    (!enableModeEligibility || isEligibleFor(mode)) ? '' : 'mode-selection__mode--inactive',
                ]"
                @click="setMode(mode)"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { Getter, State } from "vuex-class";

import { Phase } from "../../Interfaces/mca";

@Component
export default class ModeSwitcher extends Vue {

    @Prop(Boolean) readonly hidePhase!: boolean;
    @Prop({ type: String, default: "" }) readonly title!: string;
    @Prop(Boolean) readonly enableModeEligibility!: boolean;

    @State selectedMode!: string;
    @State modes!: string[];
    @Getter phase!: Phase;
    @Getter isEligibleFor!: (mode: string) => boolean;

    setMode (mode): void {
        if (!this.enableModeEligibility || this.isEligibleFor(mode)) {
            this.$store.dispatch("updateSelectedMode", mode);
        } else {
            this.$emit("inactiveModeClicked");
        }
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';

$mode-title-padding-y: 10px;
$mode-title-height: 40px;
$mode-selection-bottom-space: 31px;
 
$mode-selection-padding: 25px;
$icon-size: 45px;
$icon-margin: 15px;
$border-margin: 5px;

.mode-wrapper {
    position: relative;

    height: 100%;
    width: calc(100% - 30px);

    display: flex;
    flex-direction: column;
    align-items: flex-end;
    overflow: hidden;

    margin-left: 30px;
}

.mode-title-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.mode-title {
    font-family: 'Lexend Peta';
    font-size: 2.5rem;
    text-shadow: 0 0 4px white;
    height: 40px;

    white-space: nowrap;

    margin: #{$mode-title-padding-y} 25px #{$mode-title-padding-y} auto;
}

.mode-container {
    width: 100%;
    height: 100%;
    padding: 25px 0 0 25px;
    overflow: hidden;
}

.mode-selection {
    display: flex;
    align-items: center;
    padding: 10px $mode-selection-padding;
}


@mixin mode-container {
    @each $mode in $modes {
        &--#{$mode} {
            border-top: 3px solid var(--#{$mode});
            &::before {
                border-left: 3px solid var(--#{$mode});
            }
        }
    }
}

.mode-container {
    @include mode-container;
    @include transition;

    border-top-left-radius: 25px;
    &::before {
        content: "";
        display: block;
        position: absolute;
        left: 0px;
        top: $mode-title-height + $mode-title-padding-y * 2;
        width: 100%;
        height: calc(100% - #{$mode-title-height} - #{$mode-title-padding-y} * 2 - #{$mode-selection-bottom-space});
        border-top-left-radius: 25px;
        border-bottom-left-radius: 25px;
        z-index: -1;
    }

    &__general {
        flex-wrap: wrap;

        @media (min-width: 1200px) {
            flex-wrap: nowrap;
        }
    }

    &__stats {
        margin-bottom: 20px;

        @media (min-width: 1200px) {
            flex-wrap: nowrap;
        }
    }
}

@mixin mode-vote-color {
    @each $mode in $modes {
        &--#{$mode} {
            color: var(--#{$mode});
            background: linear-gradient(135deg,#222 0%, #222 20%, white 20%, white 22%, #222 22%, #222 24%, white 24%, white 26%, var(--#{$mode}) 26%, var(--#{$mode}) 28%, white 28%);
        }
    }
}

@mixin mode-selection-border {
    @each $mode in $modes {
        $i: index($modes, $mode);

        &--#{$mode} {
            &::before {
                border-bottom: 3px solid var(--#{$mode});
                // $i + border margin
                width: calc(100% - #{$mode-selection-padding} - #{$icon-size} * #{$i} + 28px - #{$icon-margin} * #{$i - 1});
            }
        }

        &__mode {
            &--#{$mode} {
                background-image: url("../../Assets/img/ayim-mca/#{$mode}.png");

                &::before {
                    border-bottom: 3px solid var(--#{$mode});
                }
            }

            &--#{$mode}-selected {
                background-color: var(--#{$mode});
            }
        }
    }
}

.mode-selection {
    @include mode-selection-border;
    @include transition;

    &__mode {
        cursor: pointer;
        width: $icon-size;
        height: $icon-size;
        background-repeat: no-repeat;
        background-size: cover;
        border-radius: 100%;
        margin-left: $icon-margin;
        z-index: 0;

        @include transition;

        &--inactive {
            opacity: 0.3;
        }
    }

    &::before {
        content: "";
        position: absolute;
        height: 100%;
        z-index: -1;
        left: 0;
        bottom: $mode-selection-bottom-space;
        border-bottom-left-radius: 25px;
        @include transition;
    }

}
</style>