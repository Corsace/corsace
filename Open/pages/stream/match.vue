<template>
    <div 
        v-if="matchup"
        class="matchup"
    >
        <div class="matchup__streamTitle">
            ROUND ROBIN
        </div>
        <div class="matchup__mapName">
            <div class="matchup__diamond matchup__mapName__diamond" />
            MATCH
        </div>
        <div
            v-if="matchup.team1" 
            class="matchup__team1"
        >
            <div class="matchup__team1_abbreviation">
                {{ matchup.team1.abbreviation }}
            </div>
            <div 
                class="matchup__team1_avatar"
                :style="{
                    'background-image': `url(${matchup.team1.avatarURL || '../../Assets/img/site/open/team/default.png'})`,
                }"
            />
            <div class="matchup__team1_name">
                {{ matchup.team1.name }}
            </div>
            <div class="matchup__team1_score">
                WINS
                <svg 
                    v-for="n in 5"
                    :key="n"
                    width="48" 
                    height="22" 
                    viewBox="0 0 48 22" 
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="matchup__team1_score__star"
                >
                    <path
                        d="M 31 22 H 0 L 16 0 H 48 L 31 22 Z"
                        :fill="matchup.team1Score >= n ? '#5BBCFA' : undefined"
                        :stroke="matchup.team1Score >= n ? undefined : '#5BBCFA'"
                    />
                </svg>
            </div>
            <div class="matchup__team1_score_header">
                SCORE
            </div>
        </div>
        <div
            v-if="latestMap" 
            class="matchup__beatmap"
        >
            <div class="matchup__beatmap__header">
                <div
                    class="matchup__beatmap__name"
                    :style="{color: slotMod}"
                >
                    <div 
                        class="matchup__diamond matchup__beatmap__name__diamond"
                        :style="{backgroundColor: slotMod}"
                    />
                    {{ latestMap.map.slot?.acronym.toUpperCase() }}{{ latestMap.map.order }}
                </div>
                <div class="matchup__beatmap__picked">
                    PICKED BY {{ pickedBy }}
                </div>
            </div>
            <div
                class="matchup__beatmap__info"
                :style="{ backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 50%), url(${latestMap?.map?.customBeatmap?.background || `https://assets.ppy.sh/beatmaps/${latestMap?.map?.beatmap?.beatmapset?.ID || ''}/covers/cover.jpg`})` }"
            >
                <div class="matchup__beatmap__info1">
                    <div class="matchup__beatmap__info1__title">
                        {{ latestMap.map.beatmap?.beatmapset?.title }}
                    </div>
                    <div class="matchup__beatmap__info1__artist">
                        {{ latestMap.map.beatmap?.beatmapset?.artist }}
                    </div>
                    <div class="matchup__beatmap__info1_line" />
                    <div class="matchup__beatmap__info1_text matchup__beatmap__info1_text_mapper">
                        <div class="matchup__beatmap__info1_text--mapper">
                            MAPPER
                        </div>
                        <div class="matchup__beatmap__info1_text--truncated">
                            {{ latestMap.map.customMappers?.map(mapper => mapper.osu.username).join(", ") || latestMap.map.beatmap?.beatmapset?.creator?.osu.username || '' }}
                        </div>
                    </div>
                    <div class="matchup__beatmap__info1_text matchup__beatmap__info1_text_difficulty">
                        <div class="matchup__beatmap__info1_text--difficulty">
                            DIFFICULTY
                        </div>
                        <div class="matchup__beatmap__info1_text--truncated">
                            {{ latestMap.map.beatmap?.difficulty || latestMap.map.customBeatmap?.difficulty || '' }}
                        </div>
                    </div>
                </div>
                <MappoolMapStats
                    class="matchup__beatmap__info2"
                    :mappool-map="latestMap.map"
                />
            </div>
        </div>
        <div
            v-if="matchup.team2" 
            class="matchup__team2"
        >
            <div class="matchup__team2_abbreviation">
                {{ matchup.team2.abbreviation }}
            </div>
            <div 
                class="matchup__team2_avatar"
                :style="{
                    'background-image': `url(${matchup.team2.avatarURL || '../../Assets/img/site/open/team/default.png'})`,
                }"
            />
            <div class="matchup__team2_name">
                {{ matchup.team2.name }}
            </div>
            <div class="matchup__team2_score">
                <svg 
                    v-for="n in 5"
                    :key="n"
                    width="48" 
                    height="22" 
                    viewBox="0 0 48 22" 
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="matchup__team2_score__star"
                >
                    <path
                        d="M 16 22 H 48 L 31 0 H 0.684986 L 16 22 Z"
                        :fill="matchup.team2Score >= n ? '#F24141' : undefined"
                        :stroke="matchup.team2Score >= n ? undefined : '#F24141'"
                    />
                </svg>
                WINS
            </div>
            <div class="matchup__team2_score_header">
                SCORE
            </div>
        </div>
    </div>
    <div v-else />
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";
import MappoolMapStats from "../../../Assets/components/open/MappoolMapStats.vue";

import { Matchup as MatchupInterface } from "../../../Interfaces/matchup";
import { freemodRGB, freemodButFreerRGB, modsToRGB } from "../../../Interfaces/mods";

const streamModule = namespace("stream");

@Component({
    components: {
        MappoolMapStats,
    },
    layout: "stream",
})
export default class Match extends Vue {

    @streamModule.State key!: string | null;
    @streamModule.State tournamentID!: number | null;

    matchup: MatchupInterface | null = null;
    loading = false;

    get pickedMaps () {
        if (!this.matchup?.maps)
            return [];

        return this.matchup.maps.filter(map => map.status === 2).sort((a, b) => a.order - b.order);
    }

    get latestMap () {
        if (!this.pickedMaps.length)
            return null;

        return this.pickedMaps[this.pickedMaps.length - 1];
    }

    get pickedBy () {
        if (!this.latestMap)
            return null;

        if (this.pickedMaps.length % 2 !== 0)
            return this.matchup?.first?.abbreviation.toUpperCase() || "N/A";

        return (this.matchup?.team1?.ID === this.matchup?.first?.ID ? this.matchup?.team2?.abbreviation.toUpperCase() : this.matchup?.team1?.abbreviation.toUpperCase()) || "N/A";
    }

    get slotMod (): string {
        if (!this.latestMap?.map?.slot)
            return this.RGBValuesToRGBCSS(modsToRGB(0));

        if (this.latestMap.map.slot.allowedMods === null && this.latestMap.map.slot.userModCount === null && this.latestMap.map.slot.uniqueModCount === null)
            return this.RGBValuesToRGBCSS(freemodButFreerRGB);

        if (this.latestMap.map.slot.userModCount !== null || this.latestMap.map.slot.uniqueModCount !== null)
            return this.RGBValuesToRGBCSS(freemodRGB);

        return this.RGBValuesToRGBCSS(modsToRGB(this.latestMap.map.slot.allowedMods));
    }

    RGBValuesToRGBCSS (values: [number, number, number]) {
        return `rgb(${values[0]}, ${values[1]}, ${values[2]})`;
    } 

    async mounted () {
        this.loading = true;
        const matchupID = this.$route.query.ID;
        if (typeof matchupID !== "string")
            return;

        const { data } = await this.$axios.get(`/api/matchup/${matchupID}`);
        if (data.error)
            return;

        this.matchup = data.matchup;

        this.loading = false;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
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

.matchup {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    font-family: $font-ggsans;

    &__diamond {
        transform: rotate(45deg);
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
        left: 16px;
        font-family: $font-swis721;
        font-weight: bold;
        font-size: 40px;
        color: #fff;

        display: flex;
        justify-content: center;
        align-items: center;
        gap: 13px;

        &__diamond {
            width: 10px;
            height: 10px;
            background-color: white;
        }
    }

    &__beatmap {
        &__name {
            position: fixed;
            bottom: 157px;
            left: 711px;
            font-size: 22px;
            font-weight: bold;

            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;

            &__diamond {
                width: 5px;
                height: 5px;
            }
        }

        &__picked {
            position: fixed;
            bottom: 157px;
            right: 711px;
            font-size: 22px;
            font-weight: bold;
        }

        &__info {
            background-size: cover;
            background-position: center;
            position: fixed;
            bottom: 0;
            width: 524px;
            height: 153px;
            left: 698px;
            right: 698px;

            &1, &2 {
                animation-duration: 16s;
                animation-iteration-count: infinite;
                animation-timing-function: ease-in-out;
            }

            &1 {
                color: #1D1D1D;
                animation-name: fade1;

                &__title {
                    position: absolute;
                    top: 11px;
                    right: 13px;
                    font-size: 32px;
                    font-weight: bold;
                }

                &__artist {
                    position: absolute;
                    top: 53px;
                    right: 13px;
                    font-size: 22px;
                    font-weight: bold;
                    font-style: italic;
                }

                &_line {
                    position: absolute;
                    border: 1px solid $open-red;
                    width: 301px;
                    right: 0;
                    top: 92px;
                }

                &_text {
                    position: absolute;
                    bottom: 9px;
                    display: flex;
                    flex-direction: column;

                    &_mapper {
                        right: 13px;
                    }

                    &_difficulty {
                        right: 144px;
                    }

                    &--mapper, &--difficulty {
                        font-family: $font-swis721;
                        font-weight: 700;
                        padding: 1.75px 3.5px;
                        font-size: 12px;
                        vertical-align: middle;

                    }

                    &--mapper {
                        background-color: $open-red;
                        color: #131313;
                    }

                    &--difficulty {
                        background-color: #131313;
                        color: #EBEBEB;
                    }

                    &--truncated { 
                        min-width: 0px; 
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                        text-shadow: 0 0 3px black;

                        font-size: 16px;
                    }
                }
            }

            &2 {
                animation-name: fade2;
            }
        }
    }

    &__team1_abbreviation, &__team2_abbreviation {
        font-family: $font-swis721;
        font-weight: bold;
        font-size: 27px;
        color: #1d1d1d;
        position: fixed;
        bottom: 195px;
        letter-spacing: -1.08px;
    }

    &__team1_avatar, &__team2_avatar {
        position: fixed;
        bottom: 0;
        width: 161px;
        height: 189px;
        background-size: cover;
        background-position: center;
        border: 2px solid $open-red;
    }

    &__team1_name, &__team2_name {
        position: fixed;
        bottom: 151px;
        font-size: 41px;
        font-weight: bold;
    }

    &__team1_score, &__team2_score {
        position: fixed;
        bottom: 119px;
        font-size: 12px;
        font-weight: bold;

        display: flex;
        gap: 15px;
    }

    &__team1_score_header, &__team2_score_header {
        position: fixed;
        bottom: 39px;
        font-size: 12px;
        font-weight: bold;
    }

    &__team1 {
        &_abbreviation {
            left: 55px;
        }

        &_avatar {
            left: 0;
        }
        
        &_name {
            left: 188px;
            color: #5BBCFA;
        }

        &_score {
            left: 188px;
        }

        &_score_header {
            left: 188px;
        }
    }

    &__team2 {
        &_abbreviation {
            right: 55px;
        }

        &_avatar {
            right: 0;
        }

        &_name {
            right: 188px;
            color: #F24141;
        }

        &_score {
            right: 188px;
        }

        &_score_header {
            right: 188px;
        }
    }
}

.mappool_map_stats {
    mix-blend-mode: normal;
    color: black;
    font-weight: bold;
    background-image: none;
    width: 275px;
    height: 100%;
    position: absolute;
    right: 0;
}
</style>