<template>
    <div class="stage_selector">
        <div class="stage_selector__text">
            <slot name="text" />
        </div>
        <div class="stage_selector_buttons">
            <div 
                v-if="notBeginningSync"
                class="stage_selector_buttons__left" 
                @click="$emit('prev')"
            />
            <div v-else />
            <div class="stage_selector_buttons__selected">
                <slot name="stage" />
            </div>
            <div 
                v-if="notEndSync"
                class="stage_selector_buttons__right"
                @click="$emit('next')"
            />
            <div v-else />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";

@Component
export default class StageSelector extends Vue {
    @PropSync("notBeginning", { type: Boolean, default: false }) notBeginningSync!: boolean;
    @PropSync("notEnd", { type: Boolean, default: false }) notEndSync!: boolean;
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';
.stage_selector  {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;

    &__text {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        text-align: right;
        font-size: $font-sm;
        font-stretch: condensed;
        color: #909090; // This color is not in variables
        width: min-content;
    }

    &_buttons {
        display: flex;
        flex-direction: center;
        justify-content: space-between;
        gap: 30px;

        &__left, &__right {
            cursor: pointer;
            width: 0;
            height: 0;
            border-style: solid;
            border-radius: 2px;
        }

        &__left {
            border-width: 12.5px 24px 12.5px 0;
            border-color: transparent $open-red transparent transparent;

            &:hover {
                border-color: transparent #CD2443 transparent transparent;
            }
        }

        &__selected {
            font-size: $font-base;
            font-weight: 700;
            color: $open-red;
            letter-spacing: 0.18em;
        }

        &__right {
            border-width: 12.5px 0 12.5px 24px;
            border-color: transparent transparent transparent $open-red;

            &:hover {
                border-color: transparent transparent transparent #CD2443;
            }
        }
    }
}
</style>