<template>
    <div
        v-if="poolData" 
        class="mappool_view"
    >
        <MappoolSlotDropdown
            v-for="slot in poolData.slots"
            :key="slot.ID"
            :slot-colour="slotMod(slot)"
        >
            {{ slot.name.toUpperCase() }}
            <template #content>
                <MappoolMapBanner
                    v-for="map in slot.maps"
                    :key="map.ID"
                    :mappool-map="map"
                    :slot-acronym="slot.acronym.toUpperCase()"
                    :only-map="slot.maps.length === 1"
                    :slot-colour="slotMod(slot)"
                />
            </template>
        </MappoolSlotDropdown>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import MappoolSlotDropdown from "./MappoolSlotDropdown.vue";
import MappoolMapBanner from "./MappoolMapBanner.vue";
import { Mappool, MappoolSlot } from "../../../Interfaces/mappool";
import { freemodRGB, freemodButFreerRGB, modsToRGB } from "../../../Interfaces/mods";

@Component({
    components: {
        MappoolSlotDropdown,
        MappoolMapBanner,
    },
})
export default class MappoolView extends Vue {
    @PropSync("pool", { default: null }) readonly poolData!: Mappool | null;

    slotMod (slot: MappoolSlot): string {
        if (slot.allowedMods === null && slot.userModCount === null && slot.uniqueModCount === null)
            return this.RGBValuesToRGBCSS(freemodButFreerRGB);

        if (slot.userModCount !== null || slot.uniqueModCount !== null)
            return this.RGBValuesToRGBCSS(freemodRGB);

        return this.RGBValuesToRGBCSS(modsToRGB(slot.allowedMods));
    }

    RGBValuesToRGBCSS (values: [number, number, number]) {
        return `rgb(${values[0]}, ${values[1]}, ${values[2]})`;
    } 
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

// .mappool_view {}
</style>

