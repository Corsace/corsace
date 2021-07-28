<template>
    <div class="main-container">
        <div
            v-if="!hideTitle" 
            class="mode-title-container"
        >
            <slot name="title" />
            <div class="mode-title">
                {{ selectedMode }} 
                <span v-if="!hidePhase && phase">| {{ $t(`mca.main.${phase.phase}`) }}</span>
                <span v-if="title">| {{ title }}</span>
            </div>
        </div>
        
        <div
            class="mode-wrapper"
            :class="[
                'mode-wrapper--' + selectedMode, 
                { 'mode-wrapper--hideTitle': hideTitle },
                { 'mode-wrapper--stretch': stretch },
                'mode-wrapper--skip-' + ignoreModes.length,
            ]"
        >
            <div 
                class="mode-content"
                :class="forceNoScroll ? 'mode-content--no-scroll' : ''"
            >
                <slot />
            </div>

            <div
                class="mode-selection"
                :class="'mode-selection--' + selectedMode"
            >
                <div
                    v-for="mode in availableModes"
                    :key="mode"
                    class="mode-selection__mode"
                    :class="[
                        `mode-selection__mode--${mode}`,
                        selectedMode === mode ? `mode-selection__mode--${mode}-selected` : '',
                        { 'mode-selection__mode--inactive': enableModeEligibility && !isEligibleFor(mode) },
                    ]"
                    @click="setMode(mode)"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { Getter, State } from "vuex-class";

import { Phase } from "../../Interfaces/mca";

@Component
export default class ModeSwitcher extends Vue {

    @Prop(Boolean) readonly tablet!: boolean;
    @Prop(Boolean) readonly stretch!: boolean;
    @Prop(Boolean) readonly hidePhase!: boolean;
    @Prop(Boolean) readonly enableModeEligibility!: boolean;
    @Prop(Boolean) readonly forceNoScroll!: boolean;
    @Prop({ type: Boolean, default: false }) readonly hideTitle!: boolean;
    @Prop({ type: String, default: "" }) readonly title!: string;
    @Prop({ type: Array, default: () => [] }) readonly ignoreModes!: string[];

    @State selectedMode!: string;
    @State modes!: string[];
    @Getter phase!: Phase;
    @Getter isEligibleFor!: (mode: string) => boolean;

    get availableModes () {
        return this.modes.filter(m => !this.ignoreModes.includes(m));
    }

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
$mode-selection-padding: 25px;
$base-bottom-padding: 34px;
$border-radius: 25px;

$icon-size: 45px;
$icon-margin: 15px;

.main-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    width: 100%;
    padding-bottom: 10px;
    padding-left: 0;
    
    @include breakpoint(laptop) {
        padding-left: 35px;
    }
}

.mode-title {
    &-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: flex-end;
        width: 100%;
        padding-left: $mode-selection-padding;
        padding-right: $mode-selection-padding;
        padding-bottom: $mode-title-padding-y;
        gap: 10px;
    }

    font-family: $font-display;
    font-size: $font-base;
    text-shadow: 0 0 4px white;
    text-align: center;
    width: 100%;

    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    @include breakpoint(tablet) {
        margin-left: auto;
        text-align: right;
        width: min-content;
        font-size: 2rem;
    }

    @include breakpoint(laptop) {
        font-size: 2.25rem;
    }
}

$max-height-container: calc(100% - #{$icon-size} - #{$mode-selection-padding});

.mode-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    --skip-modes: 0;

    @include breakpoint(tablet) {   
        max-height: $max-height-container;

        &--hideTitle {
            max-height: calc(#{$max-height-container} + 55px);
        }
    }

    @for $i from 1 through 5 {
        &--skip-#{$i} {
            --skip-modes: #{$i};
        }
    }

    @include breakpoint(tablet) {
        border-top: {
            width: 3px;
            style: solid;
        }

        border-left: {
            width: 3px;
            style: solid;
        }

        border-radius: #{$border-radius} 0 0 #{$border-radius};

        padding: 25px 25px $base-bottom-padding 25px;
        position: relative;
        
        &--stretch {
            padding-right: 0;
        }

        @each $mode in $modes {
            $i: index($modes, $mode);

            &--#{$mode} {
                border-color: var(--#{$mode});
                @include transition;
            }

            &--#{$mode}::before {
                content: '';
                height: 100%;
                width: calc(100% - #{$mode-selection-padding} - #{$icon-size} * (#{$i} - var(--skip-modes)) + 28px - #{$icon-margin} * (#{$i - 1} - var(--skip-modes)));
                position: absolute;
                bottom: 0;
                left: -3px;
                border-bottom: 3px solid var(--#{$mode});
                border-bottom-left-radius: $border-radius;
                z-index: -1;

                @include transition;
            }
        }
    }
}

.mode-selection {
    @include transition;
    
    display: flex;
    justify-content: center;
    order: 1;
    padding-bottom: 10px;
    padding-right: $mode-selection-padding;

    @each $mode in $modes {
        &--#{$mode} {
            border-bottom: 3px solid var(--#{$mode});
            @include transition;
            
            @include breakpoint(tablet) {
                border-bottom: none;
            }
        }
    }
    
    @include breakpoint(tablet) {
        order: 2;
        position: absolute;
        right: 0;
        bottom: calc(-#{$base-bottom-padding} / 2);
        justify-content: flex-end;
        width: 100%;
        padding-bottom: 0;
    }

    &__mode {
        cursor: pointer;
        width: $icon-size / 1.2;
        height: $icon-size / 1.2;
        background-repeat: no-repeat;
        background-size: cover;
        border-radius: 100%;
        margin-left: $icon-margin;
        z-index: 0;

        @include transition;

        @each $mode in $modes {
            &--#{$mode} {
                background-image: url("../../Assets/img/ayim-mca/#{$mode}.png");
            }

            &--#{$mode}-selected {
                background-color: var(--#{$mode});
            }
        }

        &--inactive {
            opacity: 0.3;
        }

        
        @include breakpoint(tablet) {
            width: $icon-size;
            height: $icon-size;
        }
    }
}

.mode-content {
    @include transition;

    flex: 1;
    height: 100%;
    order: 2;

    @include breakpoint(tablet) {
        order: 1;
    }

    &--no-scroll {
        height: calc(100% - 50.5px); // 50.5px = height of mobile mode selection panel

        @include breakpoint(tablet) {
            height: 100%;
        }
    }
}

</style>