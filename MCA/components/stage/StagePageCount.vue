<template>
    <div class="category-count">
        <div class="category-count__number">
            {{ remainingDays }}
        </div>
        <div class="category-count__divider" />
        <div 
            class="category-count__candidates"
            :class="`category-count__candidates--${selectedMode}`"
        >
            {{ $t('mca.main.daysLeft') }}
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, Getter } from "vuex-class";

import { Phase } from "../../../Interfaces/mca";

@Component
export default class StateContent extends Vue {

    @State selectedMode!: string;
    @Getter phase!: Phase | null;

    get remainingDays (): string {
        if (this.phase) {
            const date = Math.floor((this.phase.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return date > 9 ? date.toString() : "0" + Math.max(0, date);
        }

        return "0";
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';

.category-count {
    margin: 10px 0;
    position: relative;
    height: 100%;

    flex: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;

    @include breakpoint(laptop) {
        flex-direction: row;
        height: fit-content;
        margin: 0 10px 0 5px;
    }

    &__number {
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

    &__divider {
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

    &__candidates {
        padding: 6px;
        background-color: white;
        border-radius: 25px;
        
        @include breakpoint(laptop) {
            padding: 6px 9px 6px 6px;
            border-radius: 0 25px 25px 0;
            position: absolute;
            left: 97%;
            white-space: nowrap;
        }

        font-size: 1.2rem;
        line-height: 0.7;

        @include mode-text-color;
        @include transition;
    }

}

</style>
