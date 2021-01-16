<template>
    <div class="request">
        <div class="request__mode">
            <div
                v-for="mode in inactiveModes"
                :key="mode"
                class="mode-selection__mode"
                :class="[
                    `mode-selection__mode--${mode}`,
                    (newSelectedMode === mode) ? `mode-selection__mode--${mode}-selected` : '',
                ]"
                @click="setMode(mode)"
            />
        </div>
        <input
            v-model="newUrl"
            class="request__link"
            placeholder="link to a beatmap"
        >
        <button
            class="button"
            @click="submit"
        >
            Submit
        </button>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { Getter } from "vuex-class";

@Component
export default class GuestDifficultySubmission extends Vue {
    
    @Prop({ type: String, default: "" }) readonly url!: string;
    @Prop({ type: String, default: "" }) readonly selectedMode!: string;

    @Getter inactiveModes!: string[];
    
    newUrl = this.url;
    newSelectedMode = this.selectedMode;

    setMode (mode: string) {
        this.newSelectedMode = mode;
    }

    submit () {
        this.$emit("submit", {
            url: this.newUrl,
            mode: this.newSelectedMode,
        });
    }

}
</script>

<style lang="scss">
@use '@s-sass/_partials';
@import '@s-sass/_variables';

.request {
    @extend %spaced-container;

    &__mode {
        display: flex;
        margin-left: 10px;
        margin-right: 10px;
    }

    &__link {
        color: white;
        background-color: black;
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.63);

        font-family: $font-body;
        font-size: $font-lg;

        border: 0;
        border-radius: 0 5.5px 5.5px 0;

        margin-right: 10px;
        margin-right: 10px;
    }
}
</style>
