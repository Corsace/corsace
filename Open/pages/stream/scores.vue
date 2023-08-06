<template>
    <div 
        v-if="mapName"
        class="scores"
    >
        <div class="scores__streamTitle">
            QUALIFIER RESULTS - TEAMS
        </div>
        <div class="scores__mapName">
            {{ mapName }}
        </div>
        <div class="scores__top">
            <div 
                class="scores_video"
                :style="{ 'backgroundImage': `linear-gradient(0deg, #000 0%, rgba(0, 0, 0, 0.33) 73.96%, rgba(0, 0, 0, 0.00) 100%), url(${mappoolMap?.beatmap?.beatmapset?.ID ? `https://assets.ppy.sh/beatmaps/${mappoolMap.beatmap.beatmapset.ID}/covers/cover@2x.jpg` : mappoolMap?.customBeatmap?.background || require('../../../Assets/img/site/open/team/default.png')})` }"
            >
                <div class="scores__map">
                    <div class="scores__map_data scores__map_data--main">
                        <div class="scores__map_title">
                            {{ mappoolMap?.beatmap?.beatmapset?.title || mappoolMap?.customBeatmap?.title || '' }}
                        </div>
                        <div class="scores__map_artist">
                            {{ mappoolMap?.beatmap?.beatmapset?.artist || mappoolMap?.customBeatmap?.artist || '' }}
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
                                {{ mappoolMap?.beatmap?.difficulty || mappoolMap?.customBeatmap?.difficulty || '' }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <table class="scores_table">
                <tr>
                    <th>Rank</th>
                    <th>Team</th>
                    <th>Score</th>
                    <th>z-Score</th>
                </tr>
                <tr
                    v-for="n in 16"
                    :key="n"
                >
                    <td>#{{ n }}</td>
                    <td 
                        v-if="scores[n-1]"
                        class="scores_table__team"
                        :style="{ 'background-image': `linear-gradient(rgba(0,0,0,0.9), rgba(0,0,0,0.9)), url(${scores[n-1].avatar})` }"
                    >
                        {{ scores[n-1].name }}
                    </td>
                    <td v-if="scores[n-1]">
                        {{ scores[n-1].sum }}
                    </td>
                    <td v-if="scores[n-1]">
                        {{ scores[n-1].zScore.toFixed(2) }}
                    </td>
                </tr>
            </table>
        </div>
        <div class="scores__bottom">
            <div class="scores__histogram">
                <div 
                    v-for="(bin, index) in histogramBins"
                    :key="index"
                    class="scores__histogram_bin"
                    :style="{ height: `calc(${bin / Math.max(...histogramBins) * 100}% - 25px)` }"
                />
                <div class="scores__histogram__axis_label scores__histogram__axis_label--y">
                    # of Teams (max {{ Math.max(...histogramBins) }})
                </div>
                <div class="scores__histogram__axis_label scores__histogram__axis_label--x">
                    z-Score ({{ (minZScore + 0.01).toFixed(2) }} - {{ (maxZScore - 0.01).toFixed(2) }})
                </div>
                <div class="scores__histogram__y-axis" />
            </div>
            <MappoolMapStats
                class="scores__stats"
                :mappool-map="mappoolMap"
            />
        </div>
    </div>
    <div 
        v-else-if="!loading"
        class="scores scores--centre"
    >
        <div class="scores__streamTitle">
            QUALIFIER RESULTS - TEAMS
        </div>
        <table class="scores_table scores_table--noMap">
            <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Score</th>
                <th>z-Score</th>
            </tr>
            <tr
                v-for="n in 16"
                :key="n"
            >
                <td>#{{ n }}</td>
                <td 
                    v-if="scores[n-1]"
                    class="scores_table__team"
                    :style="{ 'background-image': `linear-gradient(rgba(0,0,0,0.9), rgba(0,0,0,0.9)), url(${scores[n-1].avatar})` }"
                >
                    {{ scores[n-1].name }}
                </td>
                <td v-if="scores[n-1]">
                    {{ scores[n-1].sum }}
                </td>
                <td v-if="scores[n-1]">
                    {{ scores[n-1].zScore.toFixed(2) }}
                </td>
            </tr>
        </table>
    </div> 
    <div v-else>
        Epic
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { QualifierScore, computeQualifierScoreViews } from "../../../Interfaces/qualifier";
import { QualifierScoreView } from "../../../Interfaces/qualifier";
import MappoolMapStats from "../../../Assets/components/open/MappoolMapStats.vue";
import { MappoolMap } from "../../../Interfaces/mappool";

const openModule = namespace("open");
const streamModule = namespace("stream");

@Component({
    components: {
        MappoolMapStats,
    },
    layout: "stream",
})
export default class Scores extends Vue {

    @streamModule.State key!: string | null;
    @streamModule.State tournamentID!: number | null;
    @openModule.State qualifierScores!: QualifierScore[] | null;

    loading = false;
    mapName: string | null = null;
    scores: QualifierScoreView[] = [];
    binNumber = 11;
    mappoolMap: MappoolMap | null = null;

    get filteredScores (): QualifierScore[] | null {
        if (!this.qualifierScores)
            return null;

        if (!this.mapName)
            return this.qualifierScores;
        
        return this.qualifierScores.filter(score => score.map.toLowerCase() === this.mapName!.toLowerCase());
    }

    get minZScore (): number {
        if (!this.filteredScores)
            return 0;

        return Math.max(...this.scores.map(score => Math.abs(score.zScore))) * -1 - 0.01;
    }

    get maxZScore (): number {
        if (!this.filteredScores)
            return 0;

        return Math.max(...this.scores.map(score => Math.abs(score.zScore))) + 0.01;
    }

    get histogramBins (): number[] {
        if (!this.filteredScores)
            return [];

        const scores = this.scores.map(score => score.zScore);
        const binSize = (this.maxZScore - this.minZScore) / this.binNumber;

        const bins: number[] = [];
        for (let i = 0; i < this.binNumber; i++) {
            const binMin = this.minZScore + i * binSize;
            const binMax = this.minZScore + (i + 1) * binSize;
            console.log(binMin, binMax);
            bins.push(scores.filter(score => score >= binMin && score < binMax).length);
        }

        return bins;
    }

    async mounted () {
        this.loading = true;
        const mapName = this.$route.query.map;
        if (typeof mapName === "string")
            this.mapName = mapName;

        this.scores = computeQualifierScoreViews(
            score => ({ id: score.teamID, name: score.teamName, avatar: score.teamAvatar }),
            this.filteredScores,
            "teams",
            "zScore",
            this.mapName ? this.filteredScores?.[0].mapID || -1 : -1,
            "desc"
        );

        if (this.mapName) {
            const { data } = await this.$axios.get(`/api/mappool/map/${this.mapName}?key=${this.key}`);
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

.scores {
    flex-direction: column;

    &--centre {
        justify-content: center;
        align-items: center;
        background-image: linear-gradient(0deg, #0F0F0F 0%, #2F2F2F 100%);
        height: calc(100% - 64px);
        margin-top: 64px;
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

    &_video, &_table, &_graph, &_stats {
        width: 50%;
        height: 100%;
    }

    &_video {
        font-family: $font-ggsans;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;

        display: flex;
        flex-direction: column;
        justify-content: flex-end;
    }

    &__map {
        display: flex;
        flex-direction: column;
        gap: 35px;

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
                width: 100%;

                padding-bottom: 50px;

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

    &_table {
        background-color: #171717;
        font-family: $font-ggsans;
        font-size: $font-lg;
        border-collapse: collapse;
        box-sizing: border-box;

        &__team {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }
    }

    &_table th {
        font-weight: 700;
        border-bottom: 1px solid #383838;
        border-left: 1px solid #383838;
    }

    &_table td {
        text-align: center;
        border-bottom: 1px solid $open-red;
        border-left: 1px solid #383838;
    }

    &_table tr:last-child td {
        border-bottom: none;
    }

    &__histogram { 
        background-color: #171B1E;
        font-family: $font-swis721;
        font-style: italic;
        text-transform: uppercase;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-end;
        position: relative;
        width: 50%;
        padding: $histogram-padding;
        overflow: hidden;

        &_bin {
            width: 100%;
            background-color: $open-red;
            position: relative;
            top: calc(-1 * (20px + #{$axis-padding}));
        }

        &__axis_label {
            position: absolute;
            font-size: $font-base;
            font-weight: 700;
            color: #fff;

            &--x {
                bottom: $histogram-padding;
                width: calc(100% - 2 * #{$histogram-padding});
                border-top: 1px solid white;
                text-align: center;
                padding: calc(#{$axis-padding} / 2);
            }

            &--y {
                width: calc(#{$bottom-height} - 2 * #{$histogram-padding} - #{$x-axis-height});
                bottom: calc(#{$histogram-padding} + #{$x-axis-height});
                left: calc(50% + #{$axis-padding});
                transform: rotate(-90deg);
                transform-origin: bottom left;
                border-top: 1px solid white;
                text-align: right;
                padding: calc(#{$axis-padding} / 2);
            }
        }
    }

    &__stats {
        width: 50%;
        background-image: none;
        padding: 50px;

        font-family: $font-ggsans;
        font-size: $font-xxxl;
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