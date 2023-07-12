<template>
    <div
        v-if="poolData" 
        class="mappool_view"
    >
        <MappoolSlotDropdown
            v-for="slot in poolData.slots"
            :slot="slot"
            :key="slot.ID"
        >
            {{ slot.name.toUpperCase() }}
            <template #content>
                <MappoolMapBanner
                    v-for="map in slot.maps"
                    :key="map.ID"
                    :mappool-map="map"
                    :slot-acronym="slot.acronym.toUpperCase()"
                    :only-map="slot.maps.length === 1"
                />
            </template>
        </MappoolSlotDropdown>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import MappoolSlotDropdown from "./MappoolSlotDropdown.vue";
import MappoolMapBanner from "./MappoolMapBanner.vue";
import { Mappool } from "../../../Interfaces/mappool";

@Component({
    components: {
        MappoolSlotDropdown,
        MappoolMapBanner,
    },
})
export default class MappoolView extends Vue {
    @PropSync("pool", { default: null }) readonly poolData!: Mappool | null;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.mappool_view {
    padding-top: 20px;
}
</style>