<template>
    <div class="map_tooltip">
        <div class="map_tooltip__top_left" />
        <div
            class="map_tooltip__banner"
            :style="`background-image: linear-gradient(rgba(0,0,0,0.66), rgba(0,0,0,0.66)), url(https://assets.ppy.sh/beatmaps/${mapSync.beatmap?.beatmapset?.ID || ''}/covers/cover.jpg)`"
        />
        <div class="map_tooltip_info">
            <div class="map_tooltip_info__wrapper">
                <div class="map_tooltip_info__wrapper__title">
                    {{ mapSync.beatmap?.beatmapset?.title }}
                </div>
                <div class="map_tooltip_info__wrapper__artist">
                    {{ mapSync.beatmap?.beatmapset?.artist }}
                </div>
            </div>
            <div class="map_tooltip_info_osu_data">
                <div class="map_tooltip_info_osu_data_text">
                    <div class="map_tooltip_info_osu_data_text--mapper">
                        {{ $t("open.qualifiers.mappool.banner.mapper") }}
                    </div>
                    <div class="map_tooltip_info_osu_data_text--truncated">
                        {{ mapSync.customMappers?.map(mapper => mapper.osu.username).join(", ") || mapSync.beatmap?.beatmapset?.creator?.osu.username || '' }}
                    </div>
                </div>
                <div class="map_tooltip_info_osu_data_text">
                    <div class="map_tooltip_info_osu_data_text--difficulty">
                        {{ $t("open.qualifiers.mappool.banner.difficulty") }}
                    </div>
                    <div class="map_tooltip_info_osu_data_text--truncated">
                        {{ censorMethod(mapSync.beatmap?.difficulty || mapSync.customBeatmap?.difficulty || '') }}
                    </div>
                </div>
            </div>
        </div>
        <div class="map_tooltip__top_right" />
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

    background: #131313;
    border: 1px solid #353535;

    width: 250px;
    min-height: 75px;
    padding-bottom: 10px;

    background-image: url("../../img/site/open/checkers-bg.png");
    background-repeat: no-repeat;
    background-size: cover;
    background-position: bottom;
    align-items: center;

    overflow: hidden;

    pointer-events: all;

    &__top_left {
        display: flex;
        position: absolute;
        top: 2px;
        left: 2px;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 8px 8px 0 0;
        border-color: $open-red transparent transparent transparent;

        z-index: 1;
    }
    &__top_right {
        display: flex;
        position: absolute;
        top: 2px;
        right: 2px;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 0 8px 8px 0;
        border-color: transparent #353535 transparent transparent;;
        z-index: 1;
    }

    &__banner {
        display: flex;
        width: 97%;
        height: 31px;
        margin-top: 4px;
        z-index: 0;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        // clip-path: polygon(0 8.00px, 8.00px 0,100% 0,100% 100%,0 100%);
        clip-path: polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%, 0 8px);
    }

    &_info {
        width: 95%;
        display: flex;
        flex-direction: column;
        justify-self: center;
        z-index: 2;
        margin-top: -5px;
        gap: 5px;
        &__wrapper {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            font-family: $font-ggsans;
            text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;
            
            &__title {
                font-size: $font-sm;
                font-weight: 600;
                line-height: 16px;
                letter-spacing: 0em;
                text-align: left;
            }

            &__artist {
                font-size: $font-xsm;
                font-style: italic;
                font-weight: 500;
                line-height: 13px;
                letter-spacing: 0em;
                text-align: left;
            }
        }

        &_osu_data {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            &_text {
                gap: 5px;
                display: flex;
                flex-direction: row;
                font-family: $font-ggsans;
                font-size: $font-xsm;
                font-weight: 500;
                line-height: 13px;
                letter-spacing: 0em;
                text-align: left;
                
                &--mapper, &--difficulty {
                    font-family: $font-swis721;
                    font-weight: 700;
                    color: #131313;
                    padding: 1px 1px;
                    font-size: $font-xsm;
                }
    
                &--mapper {
                    background-color: $open-red;
                }
    
                &--difficulty {
                    background-color: $white;
                }
    
                &--truncated { 
                    min-width: 0px; 
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }
            }

        }
    }
}
</style>