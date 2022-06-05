<template>
    <div>
        <button 
            v-for="(option, i) in options"
            :key="i"
            class="button"
            :class="[
                { 'button__add': isSelected(option) },
                `button--${viewTheme}`,
            ]"
            :style="'margin: 3px;'"
            @click.prevent="$emit('group-clicked', option)"
        >
            <span class="button--text">
                {{ option }}
            </span>
        </button>
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
    
    @State viewTheme!: "light" | "dark";

    @Prop({ type: Array, default: () => [] }) readonly options!: string[];
    @Prop({ type: Array, default: () => [] }) readonly selectedButtons!: string[]; 
    
    isSelected (option: string) {
        return this.selectedButtons.includes(option);
    }
}
</script>