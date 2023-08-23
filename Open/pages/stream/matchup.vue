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
            MATCHUP
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
            <div class="matchup__team1_info matchup__team1_info--rank">
                <div class="matchup__team1_info_header">
                    RANK AVG
                </div>
                <div class="matchup__team1_info_value">
                    {{ Math.round(matchup.team1.rank) }}
                </div>
            </div>
            <div class="matchup__team1_info matchup__team1_info--bws">
                <div class="matchup__team1_info_header">
                    BWS AVG
                </div>
                <div class="matchup__team1_info_value">
                    {{ Math.round(matchup.team1.BWS) }}
                </div>
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
                        :fill="matchup.team2Score >= n ? '#5BBCFAFF' : '#5BBCFA00'"
                        :stroke="matchup.team2Score >= n ? '#5BBCFA00' : '#5BBCFAFF'"
                    />
                </svg>
            </div>
            <div class="matchup__team1_members">
                <div class="matchup__team1_members_member">
                    <div 
                        class="matchup__team1_members_member_avatar"
                        :style="{
                            'background-image': `url(https://a.ppy.sh/${matchup.team1.manager.osuID})`,
                        }"
                    />
                    <div class="matchup__team1_members_member_username">
                        {{ matchup.team1.manager.username.toUpperCase() }}
                    </div>
                    <div class="matchup__team1_members_member_BWS">
                        MANAGER
                    </div>
                    <div class="matchup__team1_members_member_manager" />
                </div>
                <div 
                    v-for="member in matchup.team1.members.filter(member => !member.isManager)"
                    :key="member.ID"
                    class="matchup__team1_members_member"
                >
                    <div 
                        class="matchup__team1_members_member_avatar"
                        :style="{
                            'background-image': `url(https://a.ppy.sh/${member.osuID})`,
                        }"
                    />
                    <div class="matchup__team1_members_member_username">
                        {{ member.username.toUpperCase() }}
                    </div>
                    <div class="matchup__team1_members_member_BWS">
                        {{ Math.round(member.BWS) }} BWS
                    </div>
                </div>
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
            <div class="matchup__team2_info matchup__team2_info--rank">
                <div class="matchup__team2_info_header">
                    RANK AVG
                </div>
                <div class="matchup__team2_info_value">
                    {{ Math.round(matchup.team2.rank) }}
                </div>
            </div>
            <div class="matchup__team2_info matchup__team2_info--bws">
                <div class="matchup__team2_info_header">
                    BWS AVG
                </div>
                <div class="matchup__team2_info_value">
                    {{ Math.round(matchup.team2.BWS) }}
                </div>
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
                        :fill="matchup.team1Score >= n ? '#F24141FF' : '#F2414100'"
                        :stroke="matchup.team1Score >= n ? '#F2414100' : '#F24141FF'"
                    />
                </svg>
                WINS
            </div>
            <div class="matchup__team2_members">
                <div class="matchup__team2_members_member">
                    <div 
                        class="matchup__team2_members_member_avatar"
                        :style="{
                            'background-image': `url(https://a.ppy.sh/${matchup.team2.manager.osuID})`,
                        }"
                    />
                    <div class="matchup__team2_members_member_username">
                        {{ matchup.team2.manager.username.toUpperCase() }}
                    </div>
                    <div class="matchup__team2_members_member_BWS">
                        MANAGER
                    </div>
                    <div class="matchup__team2_members_member_manager" />
                </div>
                <div 
                    v-for="member in matchup.team2.members.filter(member => !member.isManager)"
                    :key="member.ID"
                    class="matchup__team2_members_member"
                >
                    <div 
                        class="matchup__team2_members_member_avatar"
                        :style="{
                            'background-image': `url(https://a.ppy.sh/${member.osuID})`,
                        }"
                    />
                    <div class="matchup__team2_members_member_username">
                        {{ member.username.toUpperCase() }}
                    </div>
                    <div class="matchup__team2_members_member_BWS">
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

import { Matchup as MatchupInterface } from "../../../Interfaces/matchup";

const streamModule = namespace("stream");

@Component({
    layout: "stream",
})
export default class Matchup extends Vue {

    @streamModule.State key!: string | null;
    @streamModule.State tournamentID!: number | null;

    matchup: MatchupInterface | null = null;
    loading = false;

    async mounted () {
        this.loading = true;
        const matchupID = this.$route.query.ID;
        if (typeof matchupID !== "string")
            return;

        const { data } = await this.$axios.get(`/api/matchup/${matchupID}/teams`);
        if (data.error)
            return;

        this.matchup = data.matchup;

        this.loading = false;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
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

    &__team1_abbreviation, &__team2_abbreviation {
        font-family: $font-swis721;
        font-weight: bold;
        font-size: 27px;
        color: #1D1D1D;
        position: fixed;
        width: 279px;
        height: 46px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #E0E0E0;
        top: 144px;
        letter-spacing: -1.08px;
    }

    &__team1_avatar, &__team2_avatar {
        position: fixed;
        top: 144px;
        width: 222px;
        height: 331px;
        background-size: cover;
        background-position: center;
        border: 2px solid #F1F1F1;
    }

    &__team1_name, &__team2_name {
        position: fixed;
        bottom: 500px;
        font-size: 41px;
        font-weight: bold;
    }

    &__team1_info, &__team2_info {
        position: fixed;
        width: 216px;
        height: 143px;
        font-family: $font-swis721;

        &_header {
            padding: 4px 11px;
            background-color: $open-red;
            font-size: 23px;
            font-weight: bold;
            color: #1D1D1D;
            width: fit-content;
            position: absolute;
            top: 0;
        }

        &_value {
            font-size: 89px;
            font-weight: bold;
            font-style: italic;
            position: absolute;
            bottom: 0;
        }

        &--rank {
            top: 206px;  
        }

        &--bws {
            top: 349px;
        }
    }

    &__team1_score, &__team2_score {
        position: fixed;
        bottom: 460px;
        font-size: 12px;
        font-weight: bold;

        display: flex;
        gap: 15px;
    }

    &__team1_members, &__team2_members {
        position: fixed;
        width: 454px;
        top: 680px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 20px;

        &_member {
            position: relative;
            height: 76px;
            width: 217px;

            border: 1px solid #767676;
            background-color: #E0E0E0;
            color: #1D1D1D;
            font-size: 16px;
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
                padding-right: 5px;
                padding-top: 5px;
                padding-bottom: 5px;
            }

            &_BWS {
                padding-right: 5px;
                background-color: $open-red;
                color: #EBEBEB;
            }

            &_manager {
                background-image: url("../../../Assets/img/site/open/team/managerBlack.svg");
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                width: 20px;
                height: 14px;
                position: absolute;
                right: 5px;
                bottom: 5px;
            }
        }
    }

    &__team1 {
        &_abbreviation {
            left: 245px;
        }

        &_avatar {
            left: 23px;
        }
        
        &_name {
            left: 23px;
            color: #5BBCFA;
        }

        &_score {
            left: 23px;
        }

        &_info {
            left: 276px;

            &_header {
                left: 0;
            }

            &_value {
                right: 0;
            }
        }

        &_members {
            left: 50px;
        }
    }

    &__team2 {
        &_abbreviation {
            right: 245px;
        }

        &_avatar {
            right: 23px;
        }

        &_name {
            right: 23px;
            color: #F24141;
        }

        &_score {
            right: 23px;
        }

        &_info {
            right: 276px;

            &_header {
                right: 0;
            }

            &_value {
                left: 0;
            }
        }

        &_members {
            right: 50px;
        }
    }
}
</style>