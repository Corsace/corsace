<template>
    <div 
        v-if="matchupSync"
        class="schedule_matchbox"
    >
        <div class="schedule_matchbox_date">
            <div class="schedule_matchbox_date__timezone">
                ID: {{ matchupSync.ID }}
            </div>
            <div class="schedule_matchbox_date__month">
                {{ formatDate(matchupSync.date) }}
            </div>
            <div class="schedule_matchbox_date__time">
                {{ formatTime(matchupSync.date) }}
            </div>
            <div class="schedule_matchbox_date__timezone">
                UTC
            </div>
        </div>
        <div class="schedule_matchbox_team">
            <div class="schedule_matchbox_team__left">
                <div
                    v-if="matchupSync.teams?.[0]"
                    class="schedule_matchbox_team_card"
                >
                    <div
                        class="schedule_matchbox_team_card__avatar" 
                        :style="{ 'backgroundImage': `url(${matchupSync.teams[0].avatarURL || require('../../../Assets/img/site/open/team/default.png')})` }" 
                    />
                    <div class="schedule_matchbox_team_card_details">
                        <div class="schedule_matchbox_team_card_details__name">
                            {{ matchupSync.teams[0].name }}
                        </div>
                        <div class="schedule_matchbox_team_card_details_teamrank">
                            <div class="schedule_matchbox_team_card--title schedule_matchbox_team_card--title_soft">
                                RANK
                            </div>
                            <div class="schedule_matchbox_team_card_details_teamrank__rank">
                                {{ Math.round(matchupSync.teams[0].rank) }}
                            </div>
                        </div>
                        <div class="schedule_matchbox_team_card_details_teambws">
                            <div class="schedule_matchbox_team_card--title schedule_matchbox_team_card--title_soft">
                                TEAM BWS AVG
                            </div>
                            <div class="schedule_matchbox_team_card_details_teambws__bws">
                                {{ Math.round(matchupSync.teams[0].BWS) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div 
                class="schedule_matchbox_team__vs"
                :style="{
                    'background-color': matchupSync.potential ? '#FF5F22' : '#EF3255'
                }"
            >
                VS
            </div>
            <div class="schedule_matchbox_team__right">
                <div
                    v-if="matchupSync.teams?.[1]"
                    class="schedule_matchbox_team_card"
                >
                    <div
                        class="schedule_matchbox_team_card__avatar" 
                        :style="{ 'backgroundImage': `url(${matchupSync.teams[1].avatarURL || require('../../../Assets/img/site/open/team/default.png')})` }" 
                    />
                    <div class="schedule_matchbox_team_card_details">
                        <div class="schedule_matchbox_team_card_details__name">
                            {{ matchupSync.teams[1].name }}
                        </div>
                        <div class="schedule_matchbox_team_card_details_teamrank">
                            <div class="schedule_matchbox_team_card--title schedule_matchbox_team_card--title_soft">
                                RANK
                            </div>
                            <div class="schedule_matchbox_team_card_details_teamrank__rank">
                                {{ Math.round(matchupSync.teams[1].rank) }}
                            </div>
                        </div>
                        <div class="schedule_matchbox_team_card_details_teambws">
                            <div class="schedule_matchbox_team_card--title schedule_matchbox_team_card--title_soft">
                                TEAM BWS AVG
                            </div>
                            <div class="schedule_matchbox_team_card_details_teambws__bws">
                                {{ Math.round(matchupSync.teams[1].BWS) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="schedule_matchbox_links">
            <IconButton link="https://www.twitch.tv/corsace">
                <img 
                    class="schedule_matchbox_links__button__twitch"
                    src="../../img/social/twitch-light.svg"
                >
            </IconButton>
            <IconButton link="https://osu.ppy.sh/">
                <img 
                    class="schedule_matchbox_links__button__twitch"
                    src="../../img/site/open/link.svg"
                >
            </IconButton>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import ContentButton from "./ContentButton.vue";
import IconButton from "../../Assets/components/open/IconButton.vue";
import { MatchupList } from "../../../Interfaces/matchup";

@Component({
    components: {
        ContentButton,
        IconButton,
    },
})
export default class ScheduleMatchBox extends Vue {
    @PropSync("matchup", { default: null }) matchupSync!: MatchupList | null;

    formatDate (date: Date): string {
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const day = date.getUTCDate();
        const monthIndex = date.getUTCMonth();
        return `${months[monthIndex]} ${day < 10 ? "0" : ""}${day}`;
    }

    formatTime (date: Date): string {
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.schedule_matchbox {
    position: relative;
    display: flex;
    flex-direction: row;
    background: linear-gradient(0deg, #131313, #131313), linear-gradient(0deg, #383838, #383838);
    border: 1px solid rgba(56, 56, 56, 1);
    height: 153px;
    width: 100%;

    &__potential {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 0em;
        text-align: center;
        position: absolute;
        text-transform: uppercase;
        left: 26px;
        top: 0;
        bottom: 0;
        transform: rotate(-90deg);
    }

    &_date {
        display: flex;
        flex-direction: column;
        padding: 30px;
        justify-content: center;
        align-items: center;
        white-space: nowrap;

        &__month {
            font-size: 21px;
            font-weight: 700;
            font-stretch: condensed;
            color: rgba(235, 235, 235, 1);
        }
        
        &__time {
            font-size: 40px;
            font-weight: 700;
            font-stretch: condensed;
            letter-spacing: 0em;
            text-align: center;
        }
        
        &__timezone {
            font-size: 12px;
            font-weight: 600;
            color: $open-red;
        }
    }

    &_team {
        display: flex;
        width: 100%;
        color: #131313;
        background-color: #FAFAFA;

        &__left {
            flex: 1;
        }
        
        &__vs {
            display: grid;
            width: 52px;
            height: 100%;
            justify-content: center;
            align-items: center;
            
            font-size: 30px;
            font-weight: 700;
            font-stretch: condensed;
            line-height: 36px;
            letter-spacing: 0em;
            text-align: center;
            
            color: white;
            
        }
        
        &__right {
            flex: 1;
        }

        &_card {
            display: flex;
            flex-direction: row;
            height: 100%;
            white-space: nowrap;

            &__avatar {
                width: 129px;
                height: 100%;
                overflow: hidden;
                
                background-repeat: no-repeat;
                background-position: center;
                background-size: cover;
                border: 1px solid $open-red;
                border-top: 0;
                border-bottom: 0;
                border-left: 0;
            }

            &_details {
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 15px;

                &__name {
                    font-size: 28px;
                    font-weight: 700;
                    line-height: 37px;
                    letter-spacing: 0em;
                    text-align: left;
                }
                &_teamrank {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 10px;
                    
                    &__rank {
                        font-size: 21px;
                        font-weight: 700;
                        line-height: 25px;
                        letter-spacing: 0em;
                        text-align: center;
                        font-stretch: condensed;
                    }
                }
                &_teambws {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 10px;

                    &__bws {
                        font-size: 21px;
                        font-weight: 700;
                        line-height: 25px;
                        letter-spacing: 0em;
                        text-align: left;
                        font-stretch: condensed;
                    }
                }

            }

            &--title {
                font-size: 12px;
                font-weight: 600;
                text-align: left;
                color: $open-red;

                &_soft {
                    font-weight: normal;
                    letter-spacing: -0.07em;
                }
            }
        }
    }

    &_links {
        display: flex;
        flex-direction: row;

        padding: 15px 15px 5px 15px;
        border-left: 1px solid $open-red;
        justify-content: space-between;

        gap: 15px;
    }
}
</style>