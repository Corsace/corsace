<template>
    <div class="mode__section">
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
            {{ mode.toUpperCase() }}
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
    @mcaAyimModule.Action updateSelectedMode

    get availableModes () {
        return this.modes.filter(m => !this.ignoreModes.includes(m));
    }

    setMode (mode): void {
        if (!this.enableModeEligibility || this.isEligibleFor(mode)) {
            this.updateSelectedMode(mode);
        } else {
            this.$emit("inactiveModeClicked");
        }
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';

$icon-size: 50px;
$icon-padding: 30px;
$icon-margin: 15px;

.mode {
    &__section {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: calc(50vw - 155px * 2.5 - 260px);
        @include breakpoint(mobile) {  
            margin-left: calc(50vw - 155px * 2.5 - 180px);
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
        width: 125px;
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

    font-size: $font-sm;
    height: 100%;
    width: 125px;
    padding: 5px $icon-padding;
    margin: 0 $icon-margin;

    @each $mode in $modes {

        &__#{$mode} {
            height: $icon-size;
            width: $icon-size;
            background-image: url("../../img/site/mca-ayim/mode/#{$mode}.png");
            background-size: $icon-size;
            background-position: center;
            background-repeat: no-repeat;

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