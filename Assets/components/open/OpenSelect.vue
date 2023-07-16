<template>
    <select
        :value="baseVal"
        class="open_select"
        @change="updateValue($event)"
    >
        <option 
            v-for="option in optionsVal" 
            :key="option.value"
            :value="option.value"
        >
            {{ option.text }}
        </option>
    </select>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";

@Component
export default class OpenSelect extends Vue {
    @PropSync("value", { type: String }) baseVal!: string;
    @PropSync("options", { type: Array }) optionsVal!: { value: string, text: string }[];

    updateValue (e) {
        this.$emit("change", e.target.value);
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.open_select {
    color: $white;
    font-family: "gg sans", sans-serif;
    font-size: $font-base;
    border: 1px solid #696969;
    background-color: #2B2B2B;
    height: 2rem;

    &:focus {
        outline: none;
    }

    & option {
        background-color: #2B2B2B;

        transition: background 0.2s ease-in-out;

        &:hover {
            background: $open-red;
        }
    }
}
</style>