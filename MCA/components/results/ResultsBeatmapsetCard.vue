<template>
    <div class="map-container">
        <div class="map">
            <a
                class="map-info"
                :style="bgImg"
                :href="`https://osu.ppy.sh/beatmapsets/${choice.id}`"
                target="_blank"
            >
                <template
                    v-for="(col, i) in columns"
                >   
                    <!-- special output for aggregation of map info on mobile -->
                    <div
                        v-if="col.label && col.label === 'map'"
                        :key="i"
                        class="map-info__map"
                        :style="flexFromCol('map')"
                    >
                        <div class="map-info__map-title">
                            {{ choice.title }}
                        </div>
                        <div class="map-info__map-artist">
                            {{ choice.artist }}
                        </div>
                        <div class="map-info__map-hoster">
                            {{ choice.hoster }}
                        </div>
                    </div>

                    <!-- regular output for non-mobile view -->
                    <span
                        v-else
                        :key="i"
                        :class="[
                            col.name ? `map-info__${col.name}` : `map-info__${col.label}`,
                            { 'map-info__centred': col.centred }, 
                            { 'map-info__prio': col.prio }
                        ]"
                        :style="flexFromCol(col.label)"
                    >
                        {{ col.label ? choice[col.label] : "" }}
                    </span>
                </template>
            </a>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { BeatmapResult, ResultColumn } from "../../../Interfaces/result";

@Component
export default class ResultsBeatmapsetCard extends Vue {
    @Prop({ type: Object, default: () => ({}) }) readonly choice!: BeatmapResult;
    @Prop({ type: Array, required: false }) columns!: ResultColumn[];
    @Prop({ type: Boolean, default: false }) readonly mobile!: boolean;


    // takes a label, matches it with the correct column from the columns prop,
    //   and returns a style object {flex: column.size}, adjusted for current breakpoint
    flexFromCol (label: string) {
        const col = this.columns.filter(
            c => ((c.label === label) || (c.name && c.name === label))
            && (c.category === "beatmaps" || !c.category)
        )[0];
        if (this.mobile && col.msize) {
            return {"flex": col.msize};
        }
        return {"flex": col.size};
    }

    get bgImg (): any {
        if (this.choice)
            return { "background-image": `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url('https://assets.ppy.sh/beatmaps/${this.choice.id}/covers/cover.jpg?1560315422')` };

        return { "background-image": "" };
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.map {
    &-container {
        flex: 0 0 auto;
        width: 100%;
    }

    @extend %flex-box;
    padding: 0;
    box-shadow: 0 0 8px rgba(255,255,255,0.25);
    cursor: pointer;

    @include transition();

    &:hover {
        box-shadow: 0 0 12px rgba(255,255,255,0.75);
    }

}

.map-info {
    display: flex;
    align-items: center;
    box-sizing: border-box;

    border-radius: 10px;
    padding: 10px 15px;
    width: 100%;

    background-size: cover;
    background-position: 34% 30%;

    color: white;
    text-shadow: 0 0 4px rgba(255,255,255,0.6);
    font-size: $font-lg;
    text-decoration: none;

    @extend %text-wrap;
    >* {
        @extend %text-wrap;
    }

    &__title {
        font-weight: 500;
    }

    &__map {
        box-sizing: content-box;

        &-title {
            text-shadow: 0 0 2px rgba(255,255,255,0.6);
            font-weight: 500;
        }

        &-artist {
            font-size: $font-base;
        }

        &-hoster {
            font-style: italic;
            font-size: $font-base;
        }
    }

    &__centred {
        display: flex;
        justify-content: center;
    }

    &__prio {
        min-width: 3rem;
    }
}
</style>