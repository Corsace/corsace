<template>
    <div class="map_tooltip">
        <div class="map_tooltip__top_left" />
        <div
            class="map_tooltip__banner"
            :style="`background-image: linear-gradient(270deg, transparent 0%, #131313 100%), url(https://assets.ppy.sh/beatmaps/${mapSync.beatmap?.beatmapset?.ID || ''}/covers/cover.jpg)`"
        />
        <div class="map_tooltip__line" />
        <div class="map_tooltip_info">
            <div class="map_tooltip_info__wrapper">
                <div class="map_tooltip_info__header">
                    {{ $t("open.qualifiers.mappool.banner.difficulty") }}
                </div>
                <div class="map_tooltip_info__text">
                    {{ censorMethod(mapSync.beatmap?.difficulty || mapSync.customBeatmap?.difficulty || '') }}
                </div>
            </div>
            <div class="map_tooltip_info__wrapper">
                <div class="map_tooltip_info__header">
                    {{ $t("open.qualifiers.mappool.banner.mapper") }}
                </div>
                <div class="map_tooltip_info__text">
                    {{ mapSync.customMappers?.map(mapper => mapper.osu.username).join(", ") || mapSync.beatmap?.beatmapset?.creator?.osu.username || '' }}
                </div>
            </div>
            <div class="map_tooltip_info__wrapper map_tooltip_info__wrapper--left">
                <div class="map_tooltip_info__title">
                    {{ censorMethod(mapSync.beatmap?.beatmapset?.title || mapSync.customBeatmap?.title || '') }}
                </div>
                <div class="map_tooltip_info__artist">
                    {{ mapSync.beatmap?.beatmapset?.artist || mapSync.customBeatmap?.artist || '' }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import { MappoolMap } from "../../../Interfaces/mappool";
import { censor, profanityFilter } from "../../../Interfaces/comment";

@Component({
    components: {
    },
})
export default class MapToolTip extends Vue {
    @PropSync("map", { type: Object }) mapSync!: MappoolMap;

    censorMethod (input: string): string {
        return censor(input, profanityFilter);
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.map_tooltip {
    display: flex;
    flex-direction: column;

    background: $open-dark;

    width: 350px;

    background-color: $open-dark;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: bottom;
    align-items: center;

    pointer-events: all;

    &__top_left {
        display: flex;
        position: absolute;
        top: 4px;
        left: 4px;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 14px 14px 0 0;
        border-color: $open-red transparent transparent transparent;
    }

    &__banner {
        margin-left: auto;
        width: 87%;
        height: 75px;
        margin-top: 4px;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
    }

    &__line {
        width: 100%;
        height: 6px;
        background-color: $open-red;
    }

    &_info {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-self: center;
        padding: 3px;
        background-color: white;
        color: black;
        font-weight: bold;

        &__text, &__title, &__artist {
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
        }

        &__wrapper {
            display: flex;
            gap: 5px;
            justify-content: flex-end;
            align-items: center;
            font-family: $font-univers;
            font-size: $font-xsm;

            &--left {
                justify-content: flex-start;
            }
        }

        &__header, &__artist {
            color: $open-red;
            font-stretch: condensed;
        }

        &__header {
            font-size: calc(0.8 * $font-xsm);
        }

        &__artist {
            font-size: $font-sm;
        }

        &__title {
            font-size: $font-base;
        }
    }
}
</style>