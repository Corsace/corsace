<template>
    <div class="mappool_slot_dropdown">
        <div 
            class="mappool_slot_dropdown__header"
            @click="isOpen = !isOpen"
        >
            <div 
                class="mappool_slot_dropdown__triangle_holder"
                :style="{ backgroundColor: slotColourSync }"
            >
                <div 
                    class="triangle mappool_slot_dropdown__triangle" 
                    :class="{ 'mappool_slot_dropdown__triangle--active': isOpen }"
                    :style="{ color: getContrastColourText }"
                />
            </div>
            <div 
                class="mappool_slot_dropdown__text"
                :style="{ backgroundColor: slotColourSync, color: getContrastColourText }"
            >
                <slot />
            </div>
        </div>
        <transition name="collapsible">
            <div
                v-show="isOpen" 
                class="mappool_slot_dropdown__content"
            >
                <div 
                    class="mappool_slot_dropdown__line"
                    :style="{ backgroundColor: slotColourSync }"
                />
                <div class="mappool_slot_dropdown__maps">
                    <slot name="content" />
                </div>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import { contrastColourText } from "../../../Interfaces/mods";

@Component
export default class MappoolSlotDropdown extends Vue {
    @PropSync("slotColour", { default: "" }) readonly slotColourSync!: string;

    isOpen = false;

    get getContrastColourText () {
        return contrastColourText(this.slotColourSync);
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.mappool_slot_dropdown {
    &__header {
        cursor: pointer;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        gap: 10px;
        margin: 10px 0px;
        color: $white;
        font-weight: bold;
    }

    &__triangle {
        color: white;
        transform: rotate(270deg);

        &--active {       
            border-top: none;
            border-bottom: 10px solid;
            transform: rotate(180deg);
        }

        &_holder {
            display: flex;
            align-items: center;
            height: 100%;
            padding: 10px 8px;
        }
    }

    &__text {
        padding: 5px 10px;
        width: 100%;
    }

    &__content {
        display: flex;
        gap: 10px;
        overflow: hidden;
    }

    &__line {
        width: 30px;
    }

    &__maps {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
    }
}

</style>