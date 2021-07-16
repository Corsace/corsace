<template>
    <div class="request">
        <div 
            v-if="!wasAccepted"
            class="request__mode"
        >
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
            placeholder="paste a beatmap link"
        >
        <button
            v-if="!wasAccepted"
            class="button"
            @click="submit"
        >
            {{ isUpdating ? 'update' : 'submit' }}
        </button>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { Getter } from "vuex-class";

import { RequestStatus } from "../../Interfaces/guestRequests";

@Component
export default class GuestDifficultySubmission extends Vue {
    
    @Prop({ type: String, default: "" }) readonly url!: string;
    @Prop({ type: String, default: "" }) readonly selectedMode!: string;
    @Prop({ type: Number, default: null }) readonly status!: RequestStatus | null;

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

    get isUpdating (): boolean {
        return (this.status || this.status === 0) ? true : false;
    }

    get wasAccepted (): boolean {
        return this.status === RequestStatus.Accepted;
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
        text-align: center;

        border-bottom: 1px solid $gray;
        border-right: 1px solid $gray;
        border-radius: 0 5.5px 5.5px 0;
        border-bottom-right-radius: 0px;
        border-top-right-radius: 0px;

        width: 60%;
        padding: 5px;
        margin: 10px;

        outline: 0;
        border: 0;

        box-shadow: 0 0 6px white;
    }
}
</style>
