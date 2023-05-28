<template>
    <div 
        class="mode__section"
        :class="`mode__section--${viewTheme}`"
    >
        <div
            v-for="mode in availableModes"
            :key="mode"
            class="mode"
            :class="[
                `mode--${viewTheme}`,
                `mode__${mode}--container`,
                selectedMode === mode ? `mode__${mode}--selected` : '',
                { 'mode--inactive': enableModeEligibility && !isEligibleFor(mode) },
            ]"
            @click="setMode(mode)"
        >
            <div 
                class="mode--overlay"
                :class="`${mode}--overlay`"
            />
            <div
                class="mode--image" 
                :class="[
                    `mode__${mode}`,
                    `mode__${mode}--${viewTheme}`,
                    selectedMode === mode ? `mode__${mode}--selected--${viewTheme}` : '',
                ]" 
            />
            {{ isSmall ? modeShort[mode] : mode.toUpperCase() }}
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import { Phase } from "../../../Interfaces/mca";

const mcaAyimModule = namespace("mca-ayim");

@Component
export default class ModeSwitcher extends Vue {

    @Prop(Boolean) readonly enableModeEligibility!: boolean;
    @Prop({ type: Array, default: () => [] }) readonly ignoreModes!: string[];

    @State viewTheme!: "light" | "dark";

    @mcaAyimModule.State selectedMode!: string;
    @mcaAyimModule.State modes!: string[];
    @mcaAyimModule.Getter phase!: Phase;
    @mcaAyimModule.Getter isEligibleFor!: (mode: string) => boolean;
    @mcaAyimModule.Action updateSelectedMode;

    modeShort = {
        standard: "STD",
        taiko: "TKO",
        fruits: "CTB",
        mania: "MAN",
        storyboard: "SB",
    };
    isSmall = false;

    get availableModes () {
        return this.modes.filter(m => !this.ignoreModes.includes(m));
    }

    setMode (mode): void {
        if (this.selectedMode === mode && this.$route.name === "year")
            this.updateSelectedMode("");
        else if (!this.enableModeEligibility || this.isEligibleFor(mode))
            this.updateSelectedMode(mode);
        else
            this.$emit("inactiveModeClicked");
    }

    mounted () {
        if (process.client) {
            this.isSmall = window.innerWidth < 992;
            window.addEventListener("resize", () => {
                this.isSmall = window.innerWidth < 992;
            });
        }
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';

$icon-size: 45px;
$icon-margin: 8px;

.mode {
    &__section {
        display: flex;
        align-items: center;
        justify-content: center;

        @include breakpoint(mobile) {
            width: 100%;
            position: absolute;
            top: 52px;
            z-index: 1;
            border-bottom: 1px solid $blue;
        }
        margin-left: auto;
        margin-right: auto;
        // 50vw - 2.5 modes - mca/ayim logo
        @include breakpoint(laptop) {
            margin-left: calc(50vw - 92px * 2.5 - 225px);
            margin-right: 0;
        }
        @include breakpoint(desktop) {
            margin-left: calc(50vw - 116px * 2.5 - 260px);
            margin-right: 0;
        }

        &--light {
            background-color: white;
        }
        &--dark {
            background-color: $dark;
        }
    }

    &--light {
        color: white;
    }
    &--dark {
        color: black;
    }

    &--overlay {
        position: absolute;
        width: 100%;
        height: 100%;
        top: -100%;
        z-index: -1;
    }

    cursor: pointer;
    z-index: 2;

    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    @include breakpoint(mobile) {
        flex: 1;
        font-size: 0;
    }
    font-size: $font-xsm;
    @include breakpoint(laptop) {
        font-size: $font-sm;
    }
    height: 100%;
    width: 50px;
    @include breakpoint(tablet) {
        width: 60px;
    }
    @include breakpoint(laptop) {
        width: 80px;
    }
    @include breakpoint(desktop) {
        width: 100px;
    }
    padding: 5px 0;
    @include breakpoint(laptop) {
        margin: 0 calc($icon-margin * 0.75);
    }
    @include breakpoint(desktop) {
        margin: 0 $icon-margin;
    }

    @each $mode in $modes {

        &__#{$mode} {
            height: $icon-size;
            width: $icon-size;
            background-image: url("../../img/site/mca-ayim/mode/#{$mode}.svg");
            background-position: center;
            background-repeat: no-repeat;
            background-size: calc($icon-size * 0.3);
            @include breakpoint(laptop) {
                background-size: calc($icon-size * 0.6);
            }

            &--dark {
                filter: invert(1);
            }

            &--selected, &--container:hover {
                & .#{$mode}--overlay {
                    top: 0;
                    background-color: var(--#{$mode});
                }
                & .mode__#{$mode}--light {
                    filter: invert(1);
                }
                & .mode__#{$mode}--dark {
                    filter: invert(0);
                }
            }

            &--selected--light {
                filter: invert(1);
            }

            &--selected--dark {
                filter: invert(0);
            }
        }
    }

    &--inactive {
        opacity: 0.3;

        & .mode--overlay {
            display: none;
            z-index: -100;
        }

        &:hover {
            @each $mode in $modes {
                & .mode__#{$mode}--light {
                    filter: invert(0)
                }
                & .mode__#{$mode}--dark {
                    filter: invert(1)
                }
            }
        }
    }
}

</style>