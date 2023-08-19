<template>
    <div class="mappool_slot_dropdown">
        <a 
            class="mappool_slot_dropdown__header"
            :style="{ color: slotMod, borderColor: slotMod }"
            @click="toggleAccordion()"
        >
            <div 
                class="triangle mappool_slot_dropdown__triangle" 
                :class="{ 'mappool_slot_dropdown__triangle--active': isOpen }"
                :style="{ color: slotMod }"
            />
            <slot />
        </a>
        <transition name="collapsible">
            <div
                v-show="isOpen" 
                class="mappool_slot_dropdown__content"
            >
                <slot name="content" />
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import { MappoolSlot } from "../../../Interfaces/mappool";
import { freemodRGB, freemodButFreerRGB, modsToRGB } from "../../../Interfaces/mods";

@Component
export default class MappoolSlotDropdown extends Vue {

    @PropSync("slot", { default: null }) readonly slotData!: MappoolSlot | null;

    isOpen = false;

    toggleAccordion () {
        this.isOpen = !this.isOpen;
    }

    get slotMod (): string {
        if (this.slotData?.allowedMods === null && this.slotData?.userModCount === null && this.slotData?.uniqueModCount === null)
            return this.RGBValuesToRGBCSS(freemodButFreerRGB);

        if (this.slotData?.userModCount !== null || this.slotData?.uniqueModCount !== null)
            return this.RGBValuesToRGBCSS(freemodRGB);

        return this.RGBValuesToRGBCSS(modsToRGB(this.slotData?.allowedMods));
    }

    RGBValuesToRGBCSS (values: [number, number, number]) {
        return `rgb(${values[0]}, ${values[1]}, ${values[2]})`;
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
        min-width: 100%;
        background: linear-gradient(180deg, #121212 0%, #1C1C1C 100%);
        border-bottom: 1px solid $open-red;
        padding: 10px;
        margin: 10px 0px;
        color: $white;
        font-weight: 600;

        &:hover {
            text-decoration: none;
        }
    }

    &__triangle {
        margin-top: 5px;
        margin-right: 10px;
        color: $open-red;
        transform: rotate(270deg);

        &--active {       
            border-top: none;
            border-bottom: 10px solid;
            transform: rotate(180deg);
        }
    }

    &__content {
        overflow: hidden;
    }
}

</style>