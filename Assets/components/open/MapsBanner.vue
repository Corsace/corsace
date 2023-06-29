<template>
    <div class="maps-banner">
        <div class="banner-img">
            <slot />
        </div>
        <div class="banner-info">
            <MapsData class="map-title" />
            <MapsData class="map-artist" />
            <MapsData />
            <MapsData />
        </div>
        <div class="banner-stats">
            <MapsData />
            <MapsData />
            <MapsData />
            <MapsData />
            <MapsData />
            <MapsData />
            <MapsData />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import MapsData from "./MapsData.vue";

@Component({
    components: {
        MapsData,
    },
})

export default class MapsBanner extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

</style>