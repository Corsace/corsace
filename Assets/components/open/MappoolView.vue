<template>
    <div 
        v-if="qualifiersStage"
        class="mappool_view"
    >
        <MappoolSlotDropdown
            v-for="mods in qualifiersStage.mappool[0].slots"
            :key="mods.ID"
        >
            {{ mods.name.toUpperCase() }}
            <template #content>
                <MappoolMapBanner
                    v-for="maps in mods.maps"
                    :key="maps.ID"
                    :mappool-map="maps"
                    :slot-acronym="mods.acronym.toUpperCase()"
                />
            </template>
        </MappoolSlotDropdown>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import MappoolSlotDropdown from "./MappoolSlotDropdown.vue";
import MappoolMapBanner from "./MappoolMapBanner.vue";

@Component({
    components: {
        MappoolSlotDropdown,
        MappoolMapBanner,
    },
})
export default class MappoolView extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.mappool_view {
    padding-top: 20px;
}
</style>