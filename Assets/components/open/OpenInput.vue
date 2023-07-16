<template>
    <input
        class="open_input" 
        type="text"
        :minlength="minVal"
        :maxlength="maxVal"
        :disabled="disabledVal"
        :placeholder="placeholderVal"
        :value="textVal"
        @input="updateText($event)"
    >
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";

@Component
export default class OpenInput extends Vue {

    @PropSync("min", { type: Number, default: 0 }) readonly minVal!: number;
    @PropSync("max", { type: Number, default: 50 }) readonly maxVal!: number;
    @PropSync("placeholder", { type: String, required: true }) readonly placeholderVal!: string;
    @PropSync("disabled", { type: Boolean, default: false }) readonly disabledVal!: boolean;
    @PropSync("text", { type: String, default: "" }) textVal!: string;

    updateText (e) {
        this.$emit("input", e.target.value);
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.open_input {
    color: $white;
    outline: none;
    font-family: $font-ggsans;
    font-size: $font-xl;
    font-weight: 800;
    border: 1px solid #696969;
    background-color: #2B2B2B;
    height: 2rem;
    min-width: 50%;
    caret-color: $open-red;

    &:invalid {
        color: $open-red;
    }

    &:focus {
        border: 1px solid $open-red;
    }
}
</style>