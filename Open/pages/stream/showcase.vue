<template>
    <div 
        v-if="mapName"
        class="scores"
    >
        <div class="scores__streamTitle">
            MAPPOOL SHOWCASE - {{ mappoolMap?.slot?.mappool?.name.toUpperCase() || '' }}
        </div>
        <div class="scores__mapName">
            {{ mapName }}
        </div>
        <div class="scores__top">
            <div 
                class="scores_bg"
            >
                <div 
                    class="scores_bg--blur"
                    :style="{ 'backgroundImage': `linear-gradient(0deg, #000 0%, rgba(0, 0, 0, 0.33) 73.96%, rgba(0, 0, 0, 0.00) 100%), url(${mappoolMap?.beatmap?.beatmapset?.ID ? `https://assets.ppy.sh/beatmaps/${mappoolMap.beatmap.beatmapset.ID}/covers/cover@2x.jpg` : mappoolMap?.customBeatmap?.background || require('../../../Assets/img/site/open/team/default.png')})` }"
                />
                <div
                    class="scores_bg--main"
                    :style="{ 'backgroundImage': mappoolMap?.beatmap?.beatmapset?.ID ? `url(https://assets.ppy.sh/beatmaps/${mappoolMap?.beatmap?.beatmapset?.ID || ''}/covers/list@2x.jpg)` : `url(${mappoolMap?.customBeatmap?.background || require('../../../Assets/img/site/open/team/default.png')}`}"
                />
            </div>
        </div>
        <div class="scores__bottom">
            <div class="scores__map">
                <div class="scores__map_data scores__map_data--main">
                    <div class="scores__map_title">
                        {{ censorMethod(mappoolMap?.beatmap?.beatmapset?.title || mappoolMap?.customBeatmap?.title || '') }}
                    </div>
                    <div class="scores__map_artist">
                        {{ censorMethod(mappoolMap?.beatmap?.beatmapset?.artist || mappoolMap?.customBeatmap?.artist || '') }}
                    </div>
                </div>
                <div class="scores__map--line" />
                <div class="scores__map_data">
                    <div class="scores__map_data_text">
                        <div class="scores__map_data_text--mapper">
                            MAPPER
                        </div>
                        <div class="scores__map_data_text--truncated">
                            {{ mappoolMap?.customMappers?.map(mapper => mapper.osu.username).join(", ") || mappoolMap?.beatmap?.beatmapset?.creator?.osu.username || '' }}
                        </div>
                    </div>
                    <div class="scores__map_data_text">
                        <div class="scores__map_data_text--difficulty">
                            DIFFICULTY
                        </div>
                        <div class="scores__map_data_text--truncated">
                            {{ censorMethod(mappoolMap?.beatmap?.difficulty || mappoolMap?.customBeatmap?.difficulty || '') }}
                        </div>
                    </div>
                </div>
            </div>
            <MappoolMapStats
                class="scores__stats"
                :mappool-map="mappoolMap"
            />
            <div
                v-if="mappoolMap?.replay" 
                class="scores__replay"
            >
                <div class="scores__replay_stat">
                    <div class="scores__replay_stat--title">
                        REPLAYER
                    </div>
                    <div class="scores__replay_stat--value">
                        {{ mappoolMap.replay.createdBy.osu.username }}
                    </div>
                </div>
                <div class="scores__replay_stat">
                    <div class="scores__replay_stat--title">
                        SCORE
                    </div>
                    <div class="scores__replay_stat--value">
                        {{ mappoolMap.replay.score }}
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div v-else>
        Epic
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";
import MappoolMapStats from "../../../Assets/components/open/MappoolMapStats.vue";
import { MappoolMap } from "../../../Interfaces/mappool";
import { censor, profanityFilter } from "../../../Interfaces/comment";

const streamModule = namespace("stream");

@Component({
    components: {
        MappoolMapStats,
    },
    layout: "stream",
})
export default class Showcase extends Vue {

    @streamModule.State key!: string | null;

    loading = false;
    mapName: string | null = null;
    mappoolMap: MappoolMap | null = null;

    censorMethod (input: string): string {
        return censor(input, profanityFilter);
    }

    async mounted () {
        this.loading = true;
        const mapName = this.$route.query.map;
        if (typeof mapName === "string")
            this.mapName = mapName;

        if (this.mapName) {
            let query = `/api/mappool/map/${this.mapName}?key=${this.key}`;
            if (this.$route.query.mappoolID)
                query += `&mappoolID=${this.$route.query.mappoolID}`;

            const { data } = await this.$axios.get(query);
            if (data.success)
                this.mappoolMap = data.mappoolMap;
        }

        this.loading = false;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

$top-margin: 122px;
$top-height: 687px;
$bottom-height: 1080px - $top-margin - $top-height;

$histogram-padding: 25px;
$axis-padding: 5px;
$x-axis-height: 25px;

@keyframes fade1 {
    0%      {opacity: 1}
    25%     {opacity: 1}
    50%     {opacity: 0}
    75%     {opacity: 0}
    100%    {opacity: 1}
}

@keyframes fade2 {
    0%      {opacity: 0}
    25%     {opacity: 0}
    50%     {opacity: 1}
    75%     {opacity: 1}
    100%    {opacity: 0}
}

.scores {
    flex-direction: column;

    &--centre {
        justify-content: center;
        align-items: center;
        background-image: linear-gradient(0deg, #0F0F0F 0%, #2F2F2F 100%);
    }

    &__streamTitle {
        position: fixed;
        top: 8px;
        left: 10px;
        font-family: $font-swis721;
        font-size: 40px;
        color: #1d1d1d;
    }

    &__mapName {
        position: fixed;
        top: 70px;
        left: 43px;
        font-family: $font-swis721;
        font-weight: bold;
        font-size: 40px;
        color: #fff;
    }

    &__top {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;

        margin-top: $top-margin;
        width: 100%;
        height: $top-height;

        border-bottom: 5px solid $open-red;
    }

    &__bottom {
        display: flex;
        width: 100%;
        height: $bottom-height;

        border-top: 5px solid $open-red;
    }

    &_stats, &__map {
        width: 50%;
        height: 100%;
    }

    &_bg {
        width: 100%;
        height: 100%;
        position: relative;

        &--blur {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            width: 100%;
            height: 100%;
            position: absolute;
            z-index: -1;
        }
        

        &--main {
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            width: 100%;
            height: 100%;

            backdrop-filter: blur(15px);
        }
    }

    &__map {
        font-family: $font-ggsans;
        background-color: #171B1E;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 35px;

        &_title, &_artist {
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: normal;
        }

        &_title {
            font-size: 58px;
            text-shadow: 0 0 3px black;
        }

        &_artist {
            font-size: 42px;
            font-style: italic;
            text-shadow: 0 0 3px black;
        }

        &--line {
            border: 1px solid $open-red;
            width: 100%;
        }

        &_data {
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            padding: 0 50px;
            min-width: 30%;

            &--main {
                line-height: 1;
                flex-direction: column;
            }

            &_text {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 10px;
                font-weight: 500;
                width: 441px;

                &--mapper, &--difficulty {
                    font-family: $font-swis721;
                    font-weight: 700;
                    color: #131313;
                    padding: 1.75px 3.5px;
                    font-size: $font-lg;
                    vertical-align: middle;

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
                    text-shadow: 0 0 3px black;

                    font-size: $font-xl;
                }
            }
        }
    }

    &__stats, &__replay {
        animation-duration: 16s;
        animation-iteration-count: infinite;
        animation-timing-function: ease-in-out;
    }

    &__stats {
        width: 50%;
        background-image: none;
        padding: 50px;

        font-family: $font-ggsans;
        font-size: $font-xxxl;
        animation-name: fade1;
    }

    &__replay {
        position: absolute;
        right: 0;
        width: 50%;
        padding: 47px;

        display: flex;
        flex-wrap: wrap;
        gap: 30px;

        animation-name: fade2;

        &_stat {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 30px;
            &--title {
                font-family: $font-swis721;
                font-size: 21px;
                font-weight: bold;
                color: #131313;
                background-color: $open-red;
                padding: 6px;
                line-height: normal;
            }

            &--value {
                font-family: $font-ggsans;
                font-size: 31px;
                font-weight: bold;
                color: $white;
                line-height: normal;
            }
        }
    }
}

.mappool_map_stats-table__img {
    width: 40px;
    height: 40px;
}

.mappool_map_stats__stat {
    display: flex;
    align-items: center;
    gap: 23px;
}
</style>
