<template>
    <div class="dropdown-container">
        <div 
            class="label-section"
            @click="showDropdown = !showDropdown"
            :style="styleLabel"
        >
            {{ options[currentOption] }}
            <span 
                class="triangle triangle-button"
                :class="triangleClass"
            />
        </div>
        <div 
            v-if="showDropdown"
            class="options-section"
        >
            <div
                v-for="(option, i) in options"
                :key="'option-' + i"
                class="dropdown-option"
                :style="{...{'top': `${26*i}px`}, ...styleDrop}"
                @click="() => {
                    showDropdown = false;
                    optionToParent(i);
                }"
            >
                {{ option }}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { State } from "vuex-class";

import { TranslateResult } from "vue-i18n";

@Component({})
export default class DropdownSelector extends Vue{
    // the DropdownSelector is implemented by passing two props:
    //   - options, an array representing the values that can be selected on-click
    //   - currentOption, a number representing the index of the current option in this array
    // this index is communicated to the parent through the event relayOption on mount and
    //   every time a new option is selected VIA the dropdown
    // it is recommended to use styleDrop to specify the width CSS attribute according to
    //   the longest text that will enter the DropdownSelector on a page 
    // an example styling is given below: 
    //   'width': `${Math.max(85 + Math.max(...textArray.map(t => t.length)) * 10, 165)}px`

    @State selectedMode!: string;
    @Prop({ type: Array, required: true }) readonly options!: TranslateResult[];
    @Prop({ type: Number, required: true }) readonly currentOption!: number;
    @Prop({ type: Object, required: false}) readonly styleLabel!: object;
    @Prop({ type: Object, required: false }) readonly styleDrop!: object;

    showDropdown = false;

    mounted() {
        this.optionToParent(0);
    }

    optionToParent (newOption: number) {
        this.$emit('relayOption', newOption);
    }

    get triangleClass (): Record<string, any>  {
        const className = `triangle-active--${this.selectedMode}`;
        const obj = {};
        obj[className] = this.showDropdown;
        return obj;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.dropdown-container {
    position: relative;
}

.label-section {
    padding: 10px;
    height: 45px;
    cursor: pointer;

    overflow: hidden;
    white-space: nowrap;

    -webkit-appearance: none;
    -moz-appearance: none;

    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;

    z-index: 1;

    padding: 5px;
    margin: 0;

    background: black;
    box-shadow: $black-shadow;
    border-radius: 5.5px;

    font-size: $font-lg;
    font-family: $font-body;
    text-shadow: 0 0 4px white;
    text-transform: uppercase;
    color: white;
    
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

    &:hover {
        background: white;
        color: black;
        text-shadow: none;
        z-index: 100;
    }

}

.options-section {
    display: flex;
    flex-direction: column;
    position: relative;
}

.dropdown-option {
    position: absolute;
    padding: 3px 0 3px 0;
    background-color: #0f0f0f;
    color: white;
    text-decoration: none;
    text-align: center;
    z-index: 100;

    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;

    min-width: 80px;
    @include breakpoint(tablet) {
        min-width: 165px;
    }
    @include breakpoint(mobile) {
        min-width: 50px;
    }
    
    @include transition('background-color, color');

    &:last-child {
        border-radius: 0 0 10px 10px;
    }

    &:hover {
        background-color: white;
        color: #0f0f0f;
    }
}

</style>