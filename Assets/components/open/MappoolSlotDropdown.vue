<template>
    <div class="mappool_slot_dropdown">
        <a 
            class="mappool_slot_dropdown__header"
            :style="{ color: slotMod }"
            @click="toggleAccordion()"
        >
            <div 
                class="triangle mappool_slot_dropdown__triangle" 
                :class="{ 'mappool_slot_dropdown__triangle--active': isOpen }"
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
import { Vue, Component } from "vue-property-decorator";

// RGB values for different mod slots
const freemod: [number, number, number] = [30, 250, 122];
const freemodButFreer: [number, number, number] = [250, 103, 30];

const mods: {
    [key: number]: [number, number, number];
} = {
    0: [235, 235, 235],
    1: [235, 235, 235],
    2: [30, 250, 37],
    8: [251, 186, 32],
    16: [242, 65, 65],
    64: [166, 30, 250],
    256: [30, 118, 250],
    512: [166, 30, 250],
    576: [166, 30, 250],
    1024: [69, 69, 69],
};

@Component
export default class MappoolSlotDropdown extends Vue {

    isOpen = false;

    allowedMods = 1; // TODO: Remove this once store is made
    userModCount = null; // TODO: Remove this once store is made
    uniqueModsCount = null; // TODO: Remove this once store is made

    toggleAccordion () {
        this.isOpen = !this.isOpen;
    }

    // TODO: Remove this. variables once store is made
    get slotMod (): string {
        if (this.allowedMods === null && this.userModCount === null && this.uniqueModsCount === null)
            return this.RGBValuesToRGBCSS(freemodButFreer);

        if (this.userModCount !== null || this.uniqueModsCount !== null)
            return this.RGBValuesToRGBCSS(freemod);

        let colours: [number, number, number][] = [];
        for (let mod in mods) {
            if (this.allowedMods & parseInt(mod)) {
                colours.push(mods[mod]);
            }
        }

        console.log(colours);

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

        &--active {       
            border-top: none;
            border-bottom: 10px solid $open-red;
            transform: rotate(90deg);
        }
    }

    &__content {
        overflow: hidden;
    }
}

</style>