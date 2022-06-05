<template>
    <button
        class="button"
        @click="changeIndex"
    >
        {{ $t(`mca.nom_vote.options.${currentOption}`) }}
        
        <div
            v-if="arrow"
            class="triangle button--triangle"
        />
    </button>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";

@Component
export default class ToggleButton extends Vue {
    
    @Prop({ type: Array, required: true }) readonly options!: string[];
    @Prop({ type: String }) readonly arrow!: string | undefined;

    @Watch("options")
    onOptionsChange () {
        this.optionIndex = 0;
    }

    optionIndex = 0;

    get currentOption (): string {
        return this.options[this.optionIndex];
    }

    changeIndex () {
        if (this.options.length <= this.optionIndex + 1) this.optionIndex = 0;
        else this.optionIndex++;

        this.$emit("change", this.currentOption);
    }

}
</script>

<style lang="scss">
</style>
