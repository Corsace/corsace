<template>
    <div class="button-group">
        <a 
            v-for="(option, i) in options"
            :key="i"
            class="grouped-button"
            :class="{ 'grouped-button--active': isSelected(option) }"
            @click.prevent="$emit('group-clicked', option)"
        >
            <span
                class="grouped-button-text"
                :class="buttonClass(option)"
            >
                {{ option }}
            </span>
        </a>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component } from "vue-property-decorator";
import { State } from "vuex-class";

@Component
export default class ButtonGroup extends Vue {
    // ButtonGroup is a container with multiple clickable buttons
    // Props: 
    //   - options is an array of labels for each button
    //   - selectedButtons is an array of the labels of all selected buttons
    //
    // Events:
    //   - emits 'group-clicked', supplying the label of a button when it is clicked
    
    @State selectedMode!: string;

    @Prop({ type: Array, default: () => [] }) readonly options!: string[];
    @Prop({ type: Array, default: () => [] }) readonly selectedButtons!: string[]; 
    
    isSelected (option: string) {
        return this.selectedButtons.includes(option);
    }

    buttonClass (option: string): Record<string, any>  {
        const className = `grouped-button-text--${this.selectedMode}`;
        const obj = {};
        obj[className] = this.isSelected(option);
        return obj;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.button-group {
    @extend %box;
    display: inline-flex;
    box-shadow: $black-shadow;
}

div.button-group {
    background: black;
    border-radius: 5.5px;
    padding: 5px;
}

.grouped-button {
    margin: 0 3px;

    border-radius: 0;

    font-size: $font-lg;
    font-family: $font-body;
    text-transform: uppercase;
    color: $inactive;
    @include breakpoint(mobile) {
        font-size: $font-base;
    }

    min-width: 70px;
    @include breakpoint(mobile) {
        min-width: 50px;
    }
    @include breakpoint(tablet) {
        min-width: 90px;
    }
    @include breakpoint(laptop) {
        min-width: 120px;
    }
    @include breakpoint(desktop) {
        min-width: 165px;
    }

    display: flex;
    align-items: center;
    justify-content: center;

    @include transition;

    -webkit-appearance: none;
    -moz-appearance: none;

    &:first-child {
        margin: 0 3px 0 0;
    }

    &:last-child {
        margin: 0 0 0 3px;
    }

    &:hover, &--active {
        color: white;
        text-shadow: 0 0 4px white;

        & > img {
            filter: invert(100%);
        }
    }

    &-text {
        border-top: 1px solid black;
        border-bottom: 1px solid black;
        @include mode-border(bottom);
        @include transition;
    }

    & > img {
        height: 25px;
        @include transition;
        @include breakpoint(mobile) {
            height: 15px;
        }
    }

    &--small {
        min-width: 50px;
        @include breakpoint(mobile) {
            min-width: 30px;
        }
        @include breakpoint(tablet) {
            min-width: 70px;
        }
        @include breakpoint(laptop) {
            min-width: 90px;
        }
        @include breakpoint(desktop) {
            min-width: 120px;
        }

        & > img {
            height: 15px;
            @include breakpoint(mobile) {
                height: 7px;
            }
        }

        text-transform: none;
        font-size: $font-base;
    }

    &__add {
        color: rgba(0, 255, 0, 0.6);
        text-shadow: 0 0 4px rgba(0, 255, 0, 0.6);
    }
    
    &__remove {
        color: rgba(255, 0, 0, 0.6);
        text-shadow: 0 0 4px rgba(255, 0, 0, 0.6);
    }
}
</style>
