<template>
    <div class="mappool_map_stats">
        <div
            v-for="stat in stats"
            :key="stat.property"
            class="mappool_map_stats__stat"
        >
            <img
                :src="require(`../../img/site/open/${stat.image}.svg`)"
                class="mappool_map_stats-table__img"
            >
            {{ map?.beatmap?.[stat.property]?.toFixed(stat.decimals) || map?.beatmap?.beatmapset?.[stat.property]?.toFixed(stat.decimals) || "" }}
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import { MappoolMap } from "../../../Interfaces/mappool";

@Component
export default class MappoolMapStats extends Vue {
    @PropSync("mappoolMap", { default: null }) readonly map!: MappoolMap | null;

    stats = [
        { image: "LEN", property: "totalLength", decimals: 0 },
        { image: "BPM", property: "BPM", decimals: 0 },
        { image: "SR", property: "totalSR", decimals: 2 },
        { image: "CS", property: "circleSize", decimals: 1 },
        { image: "AR", property: "approachRate", decimals: 1 },
        { image: "OD", property: "overallDifficulty", decimals: 1 },
        { image: "HP", property: "hpDrain", decimals: 1 },
    ];
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.mappool_map_stats {
    background-image: url('../../img/site/open/checkers-bg.png');
    mix-blend-mode: Difference;
    background-repeat: no-repeat;
    background-position: bottom 0px right 0px;
    min-width: 30%;

    padding: 8px 20px;

    display: flex;
    flex-wrap: wrap;
    gap: 15px;

    &__stat {
        flex: 1 0 25%;
    }
}

.mappool_map_stats-table {
    width: 100%;
    height: 100%;
    padding: 5px 5px;

    &__row {
        font-weight: 500;
        text-align: center;
    }

    &__img {
        vertical-align: -10%;
    }
}
</style>