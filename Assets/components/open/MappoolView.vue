<template>
    <div class="mappool_view">
        <MappoolSlotDropdown>
            NOMOD
            <template #content>
                <MappoolMapBanner />
                <MappoolMapBanner />
                <MappoolMapBanner />
            </template>
        </MappoolSlotDropdown>
        <MappoolSlotDropdown>
            HIDDEN
            <template #content>
                <MappoolMapBanner />
                <MappoolMapBanner />
            </template>
        </MappoolSlotDropdown>
        <MappoolSlotDropdown>
            HARD ROCK
        </MappoolSlotDropdown>
        <MappoolSlotDropdown>
            DOUBLE TIME
        </MappoolSlotDropdown>
        <MappoolSlotDropdown>
            FREEMOD
        </MappoolSlotDropdown>
        <MappoolSlotDropdown>
            TIEBREAKER
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