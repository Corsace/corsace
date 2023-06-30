<template>
    <div class="mappool_view">
        <MapsDropdown>
            NOMOD
            <template #content>
                <MapsBanner />
            </template>
        </MapsDropdown>
        <MapsDropdown>
            HIDDEN
        </MapsDropdown>
        <MapsDropdown>
            DOUBLETIME
        </MapsDropdown>
        <MapsDropdown>
            HARDROCK
        </MapsDropdown>
        <MapsDropdown>
            FREEMOD
        </MapsDropdown>
        <MapsDropdown>
            TIEBREAKER
        </MapsDropdown>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import MapsDropdown from "./MapsDropdown.vue";
import MapsBanner from "./MapsBanner.vue";

@Component({
    components: {
        MapsDropdown,
        MapsBanner,
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