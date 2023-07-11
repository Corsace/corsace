<template>
    <div 
        v-if="mappool"
        class="mappool_view"
    >
        <MappoolSlotDropdown
            v-for="slot in mappool.slots"
            :key="slot.ID"
        >
            {{ slot.name.toUpperCase() }}
            <template #content>
                <MappoolMapBanner
                    v-for="map in slot.maps"
                    :key="map.ID"
                    :mappool-map="map"
                    :slot-acronym="slot.acronym.toUpperCase()"
                />
            </template>
        </MappoolSlotDropdown>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
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
    @Prop({ type: Object }) mappool: Mappool | undefined;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.mappool_view {
    padding-top: 20px;
}
</style>