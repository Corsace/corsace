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

// RGB values for different mod slots
const freemod: [number, number, number] = [158, 216, 84];
const freemodButFreer: [number, number, number] = [235, 235, 235];

const mods: {
    [key: number]: [number, number, number];
} = {
    0: [41, 168, 249],
    1: [242, 129, 65],
    2: [236, 255, 184],
    4: [240, 157, 157],
    8: [251, 186, 32],
    16: [242, 65, 65],
    32: [164, 164, 164],
    64: [219, 174, 255],
    128: [177, 232, 225],
    256: [188, 111, 171],
    512: [186, 107, 248],
    576: [186, 107, 248],
    1024: [255, 233, 157],
    2048: [94, 203, 196],
    4096: [30, 208, 155],
    8192: [218, 254, 241],
    16384: [225, 255, 103],
    32768: [236, 169, 209],
    65536: [236, 169, 209],
    131072: [236, 169, 209],
    262144: [236, 169, 209],
    524288: [236, 169, 209],
    1048576: [130, 161, 240],
    2097152: [130, 161, 240],
    4194304: [130, 161, 240],
    8388608: [130, 161, 240],
    16777216: [236, 169, 209],
    33554432: [236, 169, 209],
    67108864: [236, 169, 209],
    134217728: [236, 169, 209],
    268435456: [236, 169, 209],
    1073741824: [238, 162, 145],
};

@Component
export default class MappoolSlotDropdown extends Vue {

    @PropSync("slot", { default: null }) readonly slotData!: MappoolSlot | null;

    isOpen = false;

    toggleAccordion () {
        this.isOpen = !this.isOpen;
    }

    get slotMod (): string {
        if (this.slotData?.allowedMods === null && this.slotData?.userModCount === null && this.slotData?.uniqueModCount === null)
            return this.RGBValuesToRGBCSS(freemodButFreer);

        if (this.slotData?.userModCount !== null || this.slotData?.uniqueModCount !== null)
            return this.RGBValuesToRGBCSS(freemod);

        let colours: [number, number, number][] = [];
        for (let mod in mods) {
            if (this.slotData?.allowedMods && (this.slotData?.allowedMods & parseInt(mod))) {
                colours.push(mods[mod]);
            }
        }

        if (colours.length === 0)
            return this.RGBValuesToRGBCSS(mods[0]);

        const averageColour = colours.reduce((acc, val) => {
            return [acc[0] + val[0], acc[1] + val[1], acc[2] + val[2]];
        }, [0, 0, 0]).map((val) => Math.floor(val / colours.length)) as [number, number, number];

        return this.RGBValuesToRGBCSS(averageColour);
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