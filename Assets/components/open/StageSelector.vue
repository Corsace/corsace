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
    margin-right: 50px;

    &__text {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        text-align: right;
        font-family: $font-swis721;
        font-size: $font-sm;
        color: #909090; // This color is not in variables
        font-weight: 400;
        width: min-content;
    }

    &_buttons {
        display: flex;
        flex-direction: center;
        justify-content: space-between;
        width: 130px;
        &__left {
            cursor: pointer;
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 12.5px 24px 12.5px 0;
            border-color: transparent $open-red transparent transparent;
            border-radius: 2px;
        }

        &__selected {
            font-size: $font-base;
            font-weight: 700;
            color: $open-red;
        }

        &__right {
            cursor: pointer;
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 12.5px 0 12.5px 24px;
            border-color: transparent transparent transparent $open-red;
            border-radius: 2px;
        }
    }
}
</style>