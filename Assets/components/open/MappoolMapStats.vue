<template>
    <div class="mappool_map_stats">
        <div
            v-for="stat in stats"
            :key="stat.property"
            class="mappool_map_stats__stat"
        >
            <img
                :src="require(`../../img/site/open/mappool/${stat.image}.svg`)"
            >
            {{ 
                formatStat(stat)
            }}
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import { CustomBeatmap, MappoolMap } from "../../../Interfaces/mappool";
import { Beatmap, Beatmapset } from "../../../Interfaces/beatmap";

type NumberKeys<T> = {
    [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];
type statProperty = Exclude<NumberKeys<Beatmap> | NumberKeys<Beatmapset> | NumberKeys<CustomBeatmap>, undefined>;

interface Stat {
    image: string;
    property: statProperty;
    decimals: number;
}

@Component
export default class MappoolMapStats extends Vue {
    @PropSync("mappoolMap", { default: null }) readonly map!: MappoolMap | null;

    stats: Stat[] = [
        { image: "SR", property: "totalSR", decimals: 2 },
        { image: "BPM", property: "BPM", decimals: 0 },
        { image: "LEN", property: "totalLength", decimals: 0 },
        { image: "CS", property: "circleSize", decimals: 1 },
        { image: "AR", property: "approachRate", decimals: 1 },
        { image: "OD", property: "overallDifficulty", decimals: 1 },
    ];

    formatStat (stat: Stat): string {
        let value = "";

        if (this.map?.beatmap && stat.property in this.map.beatmap)
            value = this.map.beatmap[stat.property as Exclude<NumberKeys<typeof this.map.beatmap>, undefined>].toFixed(stat.decimals);
        else if (this.map?.beatmap?.beatmapset && stat.property in this.map.beatmap.beatmapset)
            value = this.map.beatmap.beatmapset[stat.property as Exclude<NumberKeys<typeof this.map.beatmap.beatmapset>, undefined>].toFixed(stat.decimals);
        else if (this.map?.customBeatmap && stat.property in this.map.customBeatmap)
            value = this.map.customBeatmap[stat.property as Exclude<NumberKeys<typeof this.map.customBeatmap>, undefined>].toFixed(stat.decimals);

        // If the property is "totalLength", convert the value to mm:ss
        if (stat.property === "totalLength" && (
            this.map?.beatmap?.totalLength ??
            this.map?.customBeatmap?.totalLength
        )) {
            const seconds = parseInt(value);
            return this.toMinutesAndSeconds(seconds);
        }

        return value;
    }

    toMinutesAndSeconds (seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        const minutesString = String(minutes).padStart(2, "0");
        const secondsString = String(remainingSeconds).padStart(2, "0");

        return `${minutesString}:${secondsString}`;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.mappool_map_stats {
    min-width: 20%;

    padding: 8px 20px;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;

    &__stat {
        flex: 1 0 33%;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        font-stretch: condensed;
        font-weight: normal;
    }
}

</style>