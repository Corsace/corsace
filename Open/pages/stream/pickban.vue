<template>
    <div 
        v-if="matchup"
        class="pickban"
    >
        <div class="pickban__streamTitle">
            {{ matchup.stage?.name.toUpperCase() || '' }}
        </div>
        <div class="pickban__mapName">
            <div class="pickban__diamond pickban__mapName__diamond" />
            PICKBAN
        </div>
        <div class="pickban__header">
            <div
                v-if="picking" 
                class="pickban__header__picking"
                :style="{ color: nextTeamToPick?.abbreviation === matchup?.team1?.abbreviation ? '#5BBCFA' : '#F24141' }"
            >
                {{ nextTeamToPick?.abbreviation.toUpperCase() }} IS PICKING...
            </div>
        </div>
        <div
            v-if="matchup.team1" 
            class="pickban__team1"
        >
            <div class="pickban__team1_abbreviation">
                {{ matchup.team1.abbreviation.toUpperCase() }}
            </div>
            <div class="pickban__team1_notMembers">
                <div 
                    class="pickban__team1_avatar"
                    :style="{
                        'background-image': `url(${matchup.team1.avatarURL || '../../Assets/img/site/open/team/default.png'})`,
                    }"
                />
                <div class="pickban__team1_name">
                    {{ matchup.team1.name }}
                </div>
                <div class="pickban__team1_info pickban__team1_info--rank">
                    <div class="pickban__team1_info_header">
                        RANK AVG
                    </div>
                    <div class="pickban__team1_info_value">
                        {{ Math.round(matchup.team1.rank) }}
                    </div>
                </div>
                <div class="pickban__team1_info pickban__team1_info--bws">
                    <div class="pickban__team1_info_header">
                        BWS AVG
                    </div>
                    <div class="pickban__team1_info_value">
                        {{ Math.round(matchup.team1.BWS) }}
                    </div>
                </div>
                <div class="pickban__team1_score">
                    WINS
                    <svg 
                        v-for="n in 5"
                        :key="n"
                        width="48" 
                        height="22" 
                        viewBox="0 0 48 22" 
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        class="pickban__team1_score__star"
                    >
                        <path
                            d="M 31 22 H 0 L 16 0 H 48 L 31 22 Z"
                            :fill="matchup.team2Score >= n ? '#5BBCFAFF' : '#5BBCFA00'"
                            :stroke="matchup.team2Score >= n ? '#5BBCFA00' : '#5BBCFAFF'"
                        />
                    </svg>
                </div>
            </div>
            <div class="pickban__team1_members">
                <div class="pickban__team1_members_member">
                    <div 
                        class="pickban__team1_members_member_avatar"
                        :style="{
                            'background-image': `url(https://a.ppy.sh/${matchup.team1.manager.osuID})`,
                        }"
                    />
                    <div class="pickban__team1_members_member_username">
                        {{ matchup.team1.manager.username.toUpperCase() }}
                    </div>
                    <div class="pickban__team1_members_member_BWS">
                        MANAGER
                    </div>
                    <div class="pickban__team1_members_member_manager" />
                </div>
                <div 
                    v-for="member in matchup.team1.members.filter(member => !member.isManager)"
                    :key="member.ID"
                    class="pickban__team1_members_member"
                >
                    <div 
                        class="pickban__team1_members_member_avatar"
                        :style="{
                            'background-image': `url(https://a.ppy.sh/${member.osuID})`,
                        }"
                    />
                    <div class="pickban__team1_members_member_username">
                        {{ member.username.toUpperCase() }}
                    </div>
                    <div class="pickban__team1_members_member_BWS">
                        {{ Math.round(member.BWS) }} BWS
                    </div>
                </div>
            </div>
        </div>
        <div
            v-if="matchup.team2" 
            class="pickban__team2"
        >
            <div class="pickban__team2_abbreviation">
                {{ matchup.team2.abbreviation.toUpperCase() }}
            </div>
            <div class="pickban__team2_notMembers">
                <div 
                    class="pickban__team2_avatar"
                    :style="{
                        'background-image': `url(${matchup.team2.avatarURL || '../../Assets/img/site/open/team/default.png'})`,
                    }"
                />
                <div class="pickban__team2_name">
                    {{ matchup.team2.name }}
                </div>
                <div class="pickban__team2_info pickban__team2_info--rank">
                    <div class="pickban__team2_info_header">
                        RANK AVG
                    </div>
                    <div class="pickban__team2_info_value">
                        {{ Math.round(matchup.team2.rank) }}
                    </div>
                </div>
                <div class="pickban__team2_info pickban__team2_info--bws">
                    <div class="pickban__team2_info_header">
                        BWS AVG
                    </div>
                    <div class="pickban__team2_info_value">
                        {{ Math.round(matchup.team2.BWS) }}
                    </div>
                </div>
                <div class="pickban__team2_score">
                    WINS
                    <svg 
                        v-for="n in 5"
                        :key="n"
                        width="48" 
                        height="22" 
                        viewBox="0 0 48 22" 
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        class="pickban__team2_score__star"
                    >
                        <path
                            d="M 31 22 H 0 L 16 0 H 48 L 31 22 Z"
                            :fill="matchup.team1Score >= n ? '#F24141FF' : '#F2414100'"
                            :stroke="matchup.team1Score >= n ? '#F2414100' : '#F24141FF'"
                        />
                    </svg>
                </div>
            </div>
            <div class="pickban__team2_members">
                <div class="pickban__team2_members_member">
                    <div 
                        class="pickban__team2_members_member_avatar"
                        :style="{
                            'background-image': `url(https://a.ppy.sh/${matchup.team2.manager.osuID})`,
                        }"
                    />
                    <div class="pickban__team2_members_member_username">
                        {{ matchup.team2.manager.username.toUpperCase() }}
                    </div>
                    <div class="pickban__team2_members_member_BWS">
                        MANAGER
                    </div>
                    <div class="pickban__team2_members_member_manager" />
                </div>
                <div 
                    v-for="member in matchup.team2.members.filter(member => !member.isManager)"
                    :key="member.ID"
                    class="pickban__team2_members_member"
                >
                    <div 
                        class="pickban__team2_members_member_avatar"
                        :style="{
                            'background-image': `url(https://a.ppy.sh/${member.osuID})`,
                        }"
                    />
                    <div class="pickban__team2_members_member_username">
                        {{ member.username.toUpperCase() }}
                    </div>
                    <div class="pickban__team2_members_member_BWS">
                        {{ Math.round(member.BWS) }} BWS
                    </div>
                </div>
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
export default class Pickban extends Vue {

    @streamModule.State key!: string | null;
    @streamModule.State tournamentID!: number | null;

    matchup: MatchupInterface | null = null;
    loading = false;
    picking = false;

    get pickedMaps () {
        if (!this.matchup?.sets?.[this.matchup.sets.length - 1]?.maps)
            return [];

        return this.matchup.sets[this.matchup.sets.length - 1].maps!.filter(map => map.status === 2).sort((a, b) => a.order - b.order);
    }

    get latestMap () {
        if (!this.pickedMaps.length)
            return null;

        return this.pickedMaps[this.pickedMaps.length - 1];
    }

    get nextTeamToPick () {
        if (!this.latestMap)
            return null;

        if (this.pickedMaps.length % 2 === 0)
            return this.matchup?.sets?.[this.matchup.sets.length - 1]?.first;
    
        return this.matchup?.team1?.ID === this.matchup?.sets?.[this.matchup.sets.length - 1]?.first?.ID ? this.matchup?.team2 : this.matchup?.team1;
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
        console.log(this.matchup);

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

.pickban {
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

    &__header {
        position: fixed;
        width: 100%;
        height: 86px;
        top: 122px;

        &__picking {
            position: absolute;
            top: 16px;
            left: 44px;
            font-size: 40px;
            font-weight: bold;
        }
    } 

    &__team1, &__team2 {

        &_name {
            font-size: 32px;
            font-weight: bold;
            position: fixed;
            left: 16px;
        }

        &_avatar {
            position: fixed;
            width: 432px;
            height: 107px;
            left: 0;
            background-size: cover;
            background-position: center;
        }

        &_notMembers {
            animation-name: fade1;
        }

        &_abbreviation {
            font-family: $font-swis721;
            font-weight: bold;
            font-size: 27px;
            position: fixed;
            width: 432px;
            height: 51px;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #E0E0E0;
            left: 0;
            letter-spacing: 1.62px;
        }

        &_notMembers, &_members {
            animation-duration: 32s;
            animation-iteration-count: infinite;
            animation-timing-function: ease-in-out;
        }

        &_info {
            position: fixed;
            font-family: $font-swis721;
            height: 102px;
            width: 150px;
            white-space: nowrap;

            &_header {
                padding: 3px 7px;
                background-color: $open-red;
                font-size: 16px;
                font-weight: bold;
                color: #1D1D1D;
                width: fit-content;
                position: absolute;
                top: 0;
                left: 0;
            }

            &_value {
                font-size: 64px;
                font-weight: bold;
                font-style: italic;
                position: absolute;
                bottom: 0;
                right: 0;
                color: #EBEBEB;
            }

            &--rank {
                left: 16px;
            }

            &--bws {
                left: 238px;
            }
        }

        &_score {
            position: fixed;
            left: 16px;
            font-size: 12px;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 11px;
        }
        
        &_members {
            position: fixed;
            width: 395px;
            left: 18px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 17px;
            animation-name: fade2;

            &_member {
                position: relative;
                height: 66px;
                width: 189px;

                border: 1px solid #767676;
                background-color: #E0E0E0;
                color: #1D1D1D;
                font-size: 14px;
                font-weight: bold;
                text-align: right;

                overflow: hidden;

                &_avatar {
                    height: 100%;
                    width: 45px;
                    position: absolute;
                    left: 0;
                    top: 0;
                    background-size: cover;
                    background-position: center;
                }

                &_username {
                    padding-right: 4px;
                    padding-top: 4px;
                    padding-bottom: 4px;
                }

                &_BWS {
                    padding-right: 4px;
                    font-size: 12px;
                    background-color: $open-red;
                    color: #EBEBEB;
                }

                &_manager {
                    background-image: url("../../../Assets/img/site/open/team/managerBlack.svg");
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    width: 17px;
                    height: 12px;
                    position: absolute;
                    right: 4px;
                    bottom: 4px;
                }
            }
        }
    }

    &__team1 {
        color: #5BBCFA;

        &_avatar {
            top: 259px;
        }

        &_name {
            top: 382px;
        }

        &_abbreviation {
            top: 208px;
        }

        &_score {
            top: 444px;
        }

        &_info {
            top: 512px;
        }

        &_members {
            top: 288px;
        }
    }

    &__team2 {
        color: #F24141;

        &_avatar {
            top: 695px;
        }

        &_abbreviation {
            top: 644px;
        }

        &_score {
            top: 880px;
        }

        &_info {
            top: 948px;
        }
        
        &_members {
            top: 724px;
        }

        &_name {
            top: 818px;
        }
    }
}
</style>