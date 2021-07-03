<template>
    <div class="dropdown-container">
        <div 
            class="label-section button"
            @click="showDropdown = !showDropdown"
            :style="styleLabel"
        >
            {{ options[currentOption] }}
            <span 
                class="triangle triangle-button"
                :class="triangleClass"
            />
        </div>
        <template v-if="showDropdown">
            <div
                v-for="(option, i) in options"
                :key="'option-' + i"
                class="dropdown-option"
                :style="{...{'top': `calc(${1.5*i}em + 100%)`}, ...styleDrop}"
                @click="() => {
                    showDropdown = false;
                    optionToParent(i);
                }"
            >
                <span class="option-text">{{ option }}</span>
            </div>
        </template>
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
    display: flex;
    position: relative;

    font-size: $font-lg;
    @include breakpoint(mobile) {
        font-size: $font-base;
    }
    @include breakpoint(desktop) {
        max-height: 45px;
    }
}

.label-section {
    line-height: normal;
    z-index: 1;
    flex: 1;
    border-radius: inherit;

    user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;

    height: 2.25em;
    @include breakpoint(mobile) {
        height: 2em;
    }
}

.dropdown-option {
    position: absolute;
    padding: 3px 0 3px 0;
    background-color: #0f0f0f;
    color: white;
    text-decoration: none;
    text-align: center;
    z-index: 100;
    left: 50%;
    right: 50%;

    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;

    transform: translate(-50%, 0);
    
    @include transition('background-color, color');

    &:last-child {
        border-radius: 0 0 10px 10px;
    }

    &:hover {
        background-color: white;
        color: #0f0f0f;
    }
}

.option-text {
    font-size: $font-base;
}

</style>