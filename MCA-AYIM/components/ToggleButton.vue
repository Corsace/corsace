<template>
    <button
        class="button"
        @click="changeIndex"
    >
        {{ $t(`mca.nom_vote.options.${currentOption}`) }}
        
        <svg
            v-if="arrow"
            class="caret"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
        >
            <path d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z" />
        </svg>
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
.caret {
    margin-left: 5px;
}
</style>
