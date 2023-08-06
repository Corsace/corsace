<template>
    <a
        v-if="mappoolMap"
        :href="mappoolMap.beatmap?.ID ? `https://osu.ppy.sh/b/${mappoolMap.beatmap.ID}` : undefined" 
        class="mappool_map_banner"
        target="_blank"
        rel="noopener noreferrer"
    >
        <div 
            class="mappool_map_banner__text"
            :style="`background-image: url(https://assets.ppy.sh/beatmaps/${mappoolMap.beatmap?.beatmapset?.ID || ''}/covers/cover.jpg)`"
        >
            {{ slotAcronym }}{{ onlyMap ? "" : mappoolMap.order }}
        </div>

        <div class="mappool_map_banner__info">
            <div class="mappool_map_banner__song_data">
                <div class="mappool_map_banner__title">
                    {{ censorMethod(mappoolMap.beatmap?.beatmapset?.title || mappoolMap.customBeatmap?.title || '') }}
                </div>
                <div class="mappool_map_banner__artist">
                    {{ censorMethod(mappoolMap.beatmap?.beatmapset?.artist || mappoolMap.customBeatmap?.artist || '') }}
                </div>
            </div>
            <hr class="line--red line--banner">
            <div class="mappool_map_banner__osu_data">
                <div class="mappool_map_banner__osu_data_text">
                    <div class="mappool_map_banner__osu_data_text--mapper">
                        {{ $t("open.qualifiers.mappool.banner.mapper") }}
                    </div>
                    <div class="mappool_map_banner__osu_data_text--truncated">
                        {{ mappoolMap.customMappers?.map(mapper => mapper.osu.username).join(", ") || mappoolMap.beatmap?.beatmapset?.creator?.osu.username || '' }}
                    </div>
                </div>
                <div class="mappool_map_banner__osu_data_text">
                    <div class="mappool_map_banner__osu_data_text--difficulty">
                        {{ $t("open.qualifiers.mappool.banner.difficulty") }}
                    </div>
                    <div class="mappool_map_banner__osu_data_text--truncated">
                        {{ censorMethod(mappoolMap.beatmap?.difficulty || mappoolMap.customBeatmap?.difficulty || '') }}
                    </div>
                </div>
            </div>
        </div>
        <MappoolMapStats 
            :mappool-map="mappoolMap"
        />
    </a>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import MappoolMapStats from "./MappoolMapStats.vue";
import { MappoolMap } from "../../../Interfaces/mappool";
import { censor, profanityFilter } from "../../../Interfaces/comment";

@Component({
    components: {
        MappoolMapStats,
    },
})

export default class MappoolMapBanner extends Vue {
    @Prop({ type: Object }) readonly mappoolMap: MappoolMap | undefined;
    @Prop({ type: String, default: "" }) readonly slotAcronym!: string;
    @Prop({ type: Boolean, default: false }) readonly onlyMap!: boolean;

    censorMethod (input: string): string {
        return censor(input, profanityFilter);
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.mappool_map_banner {
    margin: 5px 0px;
    display: flex;
    flex-direction: row;
    height: 106px;
    background: linear-gradient(0deg, #131313, #131313);

    &:hover {
        text-decoration: none;
    }

    &__text {
        font-family: $font-swis721;
        font-weight: 700;
        font-size: $font-title;
        text-shadow: -2px 0 black, 0 2px black, 2px 0 black, 0 -2px black;
        text-align: center;
        vertical-align: middle;
        position: relative;
        width: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
    }
    

    &__info {
        background: #171B1E;
        width: 100%;
        padding-left: 15px;
    }

    &__song_data {
        display: flex;
        flex-direction: column;
        padding: 5px 15px 0px 0px;
    }

    &__title {
        font-weight: 700;
        font-size: $font-lg;
    }

    &__artist {
        font-weight: 500;
        font-style: italic;
    }

    &__osu_data {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        padding: 4px 15px 5px 0px;
        min-width: 30%;

        &_text {
            display: flex;
            flex-direction: row;
            gap: 10px;
            font-weight: 500;
            width: 205px;

            &--mapper, &--difficulty {
                font-family: $font-swis721;
                font-weight: 700;
                color: #131313;
                padding: 1.75px 3.5px;
                font-size: $font-sm;

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

</style>