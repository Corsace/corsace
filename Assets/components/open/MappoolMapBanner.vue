<template>
    <a
        v-if="mappoolMapSync"
        :href="mappoolMapSync.beatmap?.ID ? `https://osu.ppy.sh/b/${mappoolMapSync.beatmap.ID}` : undefined" 
        class="mappool_map_banner"
        target="_blank"
        rel="noopener noreferrer"
    >
        <div 
            class="mappool_map_banner__background"
            :style="`background-image: url(https://assets.ppy.sh/beatmaps/${mappoolMapSync.beatmap?.beatmapset?.ID || ''}/covers/cover.jpg)`"
        />
        <div 
            class="mappool_map_banner__slotOrder"
            :style="{ backgroundColor: slotColourSync, color: getContrastColourText }"
        >
            {{ slotAcronymSync }}{{ onlyMapSync ? "" : mappoolMapSync.order }}
        </div>
        <div class="mappool_map_banner__info">
            <div class="mappool_map_banner__song_data">
                <div class="mappool_map_banner__title">
                    {{ censorMethod(mappoolMapSync.beatmap?.beatmapset?.title || mappoolMapSync.customBeatmap?.title || '') }}
                </div>
                <div class="mappool_map_banner__artist">
                    {{ censorMethod(mappoolMapSync.beatmap?.beatmapset?.artist || mappoolMapSync.customBeatmap?.artist || '') }}
                </div>
            </div>
            <div class="mappool_map_banner__osu_data">
                <div class="mappool_map_banner__osu_data_text">
                    <div class="mappool_map_banner__osu_data_text--difficulty">
                        {{ $t("open.qualifiers.mappool.banner.difficulty") }}
                    </div>
                    <div class="mappool_map_banner__osu_data_text--truncated">
                        {{ censorMethod(mappoolMapSync.beatmap?.difficulty || mappoolMapSync.customBeatmap?.difficulty || '') }}
                    </div>
                </div>
                <div class="mappool_map_banner__osu_data_text">
                    <div class="mappool_map_banner__osu_data_text--mapper">
                        {{ $t("open.qualifiers.mappool.banner.mapper") }}
                    </div>
                    <div class="mappool_map_banner__osu_data_text--truncated">
                        {{ mappoolMapSync.customMappers?.map(mapper => mapper.osu.username).join(", ") || mappoolMapSync.beatmap?.beatmapset?.creator?.osu.username || '' }}
                    </div>
                </div>
            </div>
        </div>
        <MappoolMapStats 
            :mappool-map="mappoolMapSync"
        />
    </a>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import MappoolMapStats from "./MappoolMapStats.vue";
import { MappoolMap } from "../../../Interfaces/mappool";
import { censor, profanityFilter } from "../../../Interfaces/comment";
import { contrastColourText } from "../../../Interfaces/mods";

@Component({
    components: {
        MappoolMapStats,
    },
})

export default class MappoolMapBanner extends Vue {
    @PropSync("mappoolMap", { type: Object }) readonly mappoolMapSync: MappoolMap | undefined;
    @PropSync("slotAcronym", { type: String, default: "" }) readonly slotAcronymSync!: string;
    @PropSync("onlyMap", { type: Boolean, default: false }) readonly onlyMapSync!: boolean;
    @PropSync("slotColour", { default: "" }) readonly slotColourSync!: string;

    censorMethod (input: string): string {
        return censor(input, profanityFilter);
    }

    get getContrastColourText () {
        return contrastColourText(this.slotColourSync);
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.mappool_map_banner {
    position: relative;
    display: flex;
    flex-direction: row;
    height: 106px;
    background: linear-gradient(0deg, $open-dark, $open-dark);

    &:hover {
        text-decoration: none;
    }

    &__background {
        width: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
    }

    &__slotOrder {
        position: relative;
        line-height: 0;
        padding: 0 calc(0.75 * $font-title) 0 calc(0.4 * $font-title);
        font-size: $font-title;
        font-weight: bold;
        font-stretch: condensed;
        writing-mode: vertical-lr;
        transform: rotate(180deg);
    }

    &__info {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: white;
        font-weight: bold;
        color: black;
        width: 66%;
        max-width: 491px;
        padding: 5px 12px;
    }

    &__song_data {
        display: flex;
        flex-direction: column;
    }

    &__title {
        font-size: $font-lg;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__artist {
        color: $open-red;
    }

    &__osu_data {
        justify-content: flex-start;

        &_text {
            display: flex;
            flex-direction: row;
            font-size: $font-sm;
            gap: 10px;

            &--mapper, &--difficulty {
                color: $open-red;
                font-size: $font-xsm;
                align-self: center;
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