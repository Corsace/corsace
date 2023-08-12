<template>
    <div 
        v-if="matchup"
        class="matchup"
    >
        <div class="matchup__streamTitle">
            ROUND ROBIN
        </div>
        <div class="matchup__mapName">
            <div 
                class="matchup__diamond matchup__mapName__diamond"
                :style="{backgroundColor: 'white'}"
            />
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
                        {{ latestMap.map.beatmap.beatmapset.title }}
                    </div>
                    <div class="matchup__beatmap__info1__artist">
                        {{ latestMap.map.beatmap.beatmapset.artist }}
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
export default class Matchup extends Vue {

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

        this.matchup = {
            "ID": 249,
            "date": new Date("2023-08-13T04:00:00.000Z"),
            "mp": null,
            "vod": null,
            "team1Score": 3,
            "team2Score": 0,
            "team1": {
                "ID": 1,
                "name": "FLOPINSKI",
                "abbreviation": "ESSA",
                "timezoneOffset": -1,
                "avatarURL": "https://tournament-team-avatars.corsace.io/1_1690596807745.png",
                "manager": {
                    "ID": 8334,
                    "username": "MonkiDonki",
                    "osuID": "5298487",
                    "BWS": 0,
                    "isManager": true,
                },
                "members": [
                    {
                        "ID": 3252,
                        "username": "enri",
                        "osuID": "8640970",
                        "BWS": 11.23622468020549,
                        "isManager": false,
                    },
                    {
                        "ID": 3539,
                        "username": "tekkito",
                        "osuID": "7075211",
                        "BWS": 18.99899179288283,
                        "isManager": false,
                    },
                    {
                        "ID": 4698,
                        "username": "Intercambing",
                        "osuID": "2546001",
                        "BWS": 2.1078478260241305,
                        "isManager": false,
                    },
                    {
                        "ID": 4770,
                        "username": "maliszewski",
                        "osuID": "12408961",
                        "BWS": 1.0572336417115773,
                        "isManager": false,
                    },
                    {
                        "ID": 8022,
                        "username": "ninerik",
                        "osuID": "10549880",
                        "BWS": 3.266402565957539,
                        "isManager": false,
                    },
                    {
                        "ID": 8335,
                        "username": "gnahus",
                        "osuID": "12779141",
                        "BWS": 5.434076366203132,
                        "isManager": false,
                    },
                ],
                "pp": 18721.8,
                "BWS": 6.90579716163078,
                "rank": 33.666666666666664,
                "tournaments": [
                    {
                        "ID": 1,
                        "name": "Corsace Open 2023",
                    },
                ],
                "qualifier": {
                    "ID": 11,
                    "date": new Date("2023-07-25T18:00:00.000Z"),
                    "mp": 109675119,
                },
            },
            "team2": {
                "ID": 1,
                "name": "FLOPINSKI",
                "abbreviation": "ESSA",
                "timezoneOffset": -1,
                "avatarURL": "https://tournament-team-avatars.corsace.io/1_1690596807745.png",
                "manager": {
                    "ID": 8334,
                    "username": "MonkiDonki",
                    "osuID": "5298487",
                    "BWS": 0,
                    "isManager": true,
                },
                "members": [
                    {
                        "ID": 3252,
                        "username": "enri",
                        "osuID": "8640970",
                        "BWS": 11.23622468020549,
                        "isManager": false,
                    },
                    {
                        "ID": 3539,
                        "username": "tekkito",
                        "osuID": "7075211",
                        "BWS": 18.99899179288283,
                        "isManager": false,
                    },
                    {
                        "ID": 4698,
                        "username": "Intercambing",
                        "osuID": "2546001",
                        "BWS": 2.1078478260241305,
                        "isManager": false,
                    },
                    {
                        "ID": 4770,
                        "username": "maliszewski",
                        "osuID": "12408961",
                        "BWS": 1.0572336417115773,
                        "isManager": false,
                    },
                    {
                        "ID": 8022,
                        "username": "ninerik",
                        "osuID": "10549880",
                        "BWS": 3.266402565957539,
                        "isManager": false,
                    },
                    {
                        "ID": 8335,
                        "username": "gnahus",
                        "osuID": "12779141",
                        "BWS": 5.434076366203132,
                        "isManager": false,
                    },
                ],
                "pp": 18721.8,
                "BWS": 6.90579716163078,
                "rank": 33.666666666666664,
                "tournaments": [
                    {
                        "ID": 1,
                        "name": "Corsace Open 2023",
                    },
                ],
                "qualifier": {
                    "ID": 11,
                    "date": new Date("2023-07-25T18:00:00.000Z"),
                    "mp": 109675119,
                },
            },
            "first": {
                "ID": 1,
                "name": "FLOPINSKI",
                "abbreviation": "ESSA",
                "timezoneOffset": -1,
                "avatarURL": "https://tournament-team-avatars.corsace.io/1_1690596807745.png",
                "manager": {
                    "ID": 8334,
                    "username": "MonkiDonki",
                    "osuID": "5298487",
                    "BWS": 0,
                    "isManager": true,
                },
                "members": [
                    {
                        "ID": 3252,
                        "username": "enri",
                        "osuID": "8640970",
                        "BWS": 11.23622468020549,
                        "isManager": false,
                    },
                    {
                        "ID": 3539,
                        "username": "tekkito",
                        "osuID": "7075211",
                        "BWS": 18.99899179288283,
                        "isManager": false,
                    },
                    {
                        "ID": 4698,
                        "username": "Intercambing",
                        "osuID": "2546001",
                        "BWS": 2.1078478260241305,
                        "isManager": false,
                    },
                    {
                        "ID": 4770,
                        "username": "maliszewski",
                        "osuID": "12408961",
                        "BWS": 1.0572336417115773,
                        "isManager": false,
                    },
                    {
                        "ID": 8022,
                        "username": "ninerik",
                        "osuID": "10549880",
                        "BWS": 3.266402565957539,
                        "isManager": false,
                    },
                    {
                        "ID": 8335,
                        "username": "gnahus",
                        "osuID": "12779141",
                        "BWS": 5.434076366203132,
                        "isManager": false,
                    },
                ],
                "pp": 18721.8,
                "BWS": 6.90579716163078,
                "rank": 33.666666666666664,
                "tournaments": [
                    {
                        "ID": 1,
                        "name": "Corsace Open 2023",
                    },
                ],
                "qualifier": {
                    "ID": 11,
                    "date": new Date("2023-07-25T18:00:00.000Z"),
                    "mp": 109675119,
                },
            },
            "maps": [
                {
                    "ID": 1,
                    "map": {
                        "ID": 4,
                        "createdAt": "2023-07-29T22:37:59.015Z",
                        "lastUpdate": "2023-07-29T22:37:59.000Z",
                        "order": 1,
                        "isCustom": true,
                        "deadline": null,
                        "slot": {
                            "ID": 3,
                            "createdAt": "2023-07-29T22:37:59.012Z",
                            "mappool": {
                                "ID": 2,
                                "createdAt": "2023-07-29T22:37:59.008Z",
                                "name": "upload",
                                "abbreviation": "upl",
                                "isPublic": false,
                                "bannable": false,
                                "mappackLink": null,
                                "mappackExpiry": null,
                                "targetSR": 8,
                                "order": 1,
                            },
                            "name": "Nomod",
                            "acronym": "NM",
                            "colour": null,
                            "allowedMods": 16,
                            "userModCount": null,
                            "uniqueModCount": null,
                        },
                        "customThreadID": null,
                        "customMessageID": null,
                        "customMappers": [
                            {
                                "ID": 1546,
                                "discord": {
                                    "userID": "352605625869402123",
                                    "username": "pink blood",
                                    "avatar": "",
                                    "dateAdded": "2021-06-02T07:48:23.540Z",
                                    "lastVerified": "2021-06-02T07:48:23.000Z",
                                },
                                "osu": {
                                    "userID": "4323406",
                                    "username": "VINXIS",
                                    "avatar": "https://a.ppy.sh/4323406",
                                    "dateAdded": "2021-06-02T07:48:23.540Z",
                                    "lastVerified": "2021-06-02T07:48:23.000Z",
                                },
                                "country": "CA",
                                "registered": "2021-06-02T07:48:23.540Z",
                                "lastLogin": "2021-06-02T07:48:23.000Z",
                                "canComment": true,
                            },
                        ],
                        "customBeatmap": {
                            "ID": 2,
                            "link": "https://cdn.discordapp.com/attachments/1122650852923023451/1137597021910487201/Yosi_Horikawa_-_Letter.osz",
                            "background": "https://cdn.discordapp.com/attachments/1122650852923023451/1137597029409886279/86818644_p1.png",
                            "artist": "Yosi Horikawa",
                            "title": "Letter",
                            "BPM": 110,
                            "totalLength": 80,
                            "hitLength": 80,
                            "difficulty": "V",
                            "circleSize": 4,
                            "overallDifficulty": 8,
                            "approachRate": 9,
                            "hpDrain": 3,
                            "circles": 87,
                            "sliders": 37,
                            "spinners": 0,
                            "maxCombo": 356,
                            "aimSR": 3.031670536343471,
                            "speedSR": 2.2088123321170414,
                            "totalSR": 5.651911970573727,
                        },
                        "beatmap": {
                            "ID": 2116069,
                            "beatmapsetID": 1010927,
                            "beatmapset": {
                                "ID": 1010927,
                                "artist": "ELECTROCUTICA feat. F9",
                                "title": "Triplaneta",
                                "submitDate": "2019-07-29T00:10:37.000Z",
                                "approvedDate": "2019-08-24T02:40:01.000Z",
                                "rankedStatus": -2,
                                "BPM": 72,
                                "genre": "electronic",
                                "language": "japanese",
                                "favourites": 339,
                                "tags": "reversus treow kiyono japanese electronic リヴェルサス",
                                "creator": {
                                    "ID": 1453,
                                    "discord": {
                                        "userID": null,
                                        "username": "",
                                        "avatar": "",
                                        "dateAdded": "2021-06-02T07:47:44.504Z",
                                        "lastVerified": "2021-06-02T07:47:44.000Z",
                                    },
                                    "osu": {
                                        "userID": "3513559",
                                        "username": "deetz",
                                        "avatar": "https://a.ppy.sh/3513559",
                                        "dateAdded": "2021-06-02T07:47:44.504Z",
                                        "lastVerified": "2021-06-02T07:47:44.000Z",
                                    },
                                    "country": "CA",
                                    "registered": "2021-06-02T07:47:44.504Z",
                                    "lastLogin": "2021-06-02T07:47:44.000Z",
                                    "canComment": true,
                                },
                            },
                            "totalLength": 359,
                            "hitLength": 331,
                            "difficulty": "FALL",
                            "circleSize": 4,
                            "overallDifficulty": 8,
                            "approachRate": 9,
                            "hpDrain": 5,
                            "circles": 565,
                            "sliders": 520,
                            "spinners": 1,
                            "rating": 9.48505,
                            "storyboard": false,
                            "video": false,
                            "playCount": 60453,
                            "passCount": 12105,
                            "packs": "R279,S809",
                            "maxCombo": 1633,
                            "aimSR": 2.88146,
                            "speedSR": 2.2418,
                            "totalSR": 5.44309,
                        },
                    },
                    "order": 1,
                    "status": 2,
                },
            ],
        };

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