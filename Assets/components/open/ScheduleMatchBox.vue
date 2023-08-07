<template>
    <div 
        v-if="matchSync"
        class="schedule_matchbox"
    >
        <div class="schedule_matchbox_date">
            <div class="schedule_matchbox_date__month">
                {{ formatDate(matchSync.date) }}
            </div>
            <div class="schedule_matchbox_date__time">
                {{ formatTime(matchSync.date) }}
            </div>
            <div class="schedule_matchbox_date__timezone">
                UTC
            </div>
        </div>
        <div class="schedule_matchbox_team">
            <div class="schedule_matchbox_team__left">
                <TeamCard
                    v-if="matchSync.teams?.[0]"
                    :avatar="matchSync.teams[0].avatarURL"
                >
                    <template #name>
                        {{ matchSync.teams[0].name }}
                    </template>
                    <template #rank>
                        {{ Math.round(matchSync.teams[0].rank) }}
                    </template>
                    <template #bws>
                        {{ Math.round(matchSync.teams[0].BWS) }}
                    </template>
                </TeamCard>
            </div>
            <div class="schedule_matchbox_team__vs">
                VS
            </div>
            <div class="schedule_matchbox_team__right">
                <TeamCard
                    v-if="matchSync.teams?.[1]"
                    :avatar="matchSync.teams[1].avatarURL"
                >
                    <template #name>
                        {{ matchSync.teams[1].name }}
                    </template>
                    <template #rank>
                        {{ Math.round(matchSync.teams[1].rank) }}
                    </template>
                    <template #bws>
                        {{ Math.round(matchSync.teams[1].BWS) }}
                    </template>
                </TeamCard>
            </div>
        </div>
        <div class="schedule_matchbox_links">
            <IconButton link="https://www.twitch.tv/corsace">
                <img 
                    class="schedule_matchbox_links__button__twitch"
                    src="../../img/social/twitch-dark.svg"
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
import TeamCard from "../../Assets/components/open/TeamCard.vue";
import IconButton from "../../Assets/components/open/IconButton.vue";
import { MatchupList } from "../../../Interfaces/matchup";

@Component({
    components: {
        ContentButton,
        TeamCard,
        IconButton,
    },
})
export default class ScheduleMatchBox extends Vue {
    @PropSync("match", { default: null }) matchSync!: MatchupList | null;

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
    display: flex;
    flex-direction: row;
    background: linear-gradient(0deg, #131313, #131313), linear-gradient(0deg, #383838, #383838);
    border: 1px solid rgba(56, 56, 56, 1);
    height: 153px;
    width: 100%;

    &_date {
        display: flex;
        flex-direction: column;
        padding: 25px;
        justify-content: center;
        align-items: center;
        white-space: nowrap;

        &__month {
            font-family: $font-swis721;
            font-weight: 700;
            font-size: 21px;
            color: rgba(235, 235, 235, 1);
        }
        
        &__time {
            font-family: $font-swis721;
            font-size: 40px;
            font-weight: 700;
            letter-spacing: 0em;
            text-align: center;
        }
        
        &__timezone {
            font-family: $font-ggsans;
            font-size: 12px;
            font-weight: 600;
            color: $open-red;
        }
    }

    &_team {
        display: flex;
        width: 100%;

        &__left {
            flex-grow: 2;
        }
        
        &__vs {
            display: grid;
            width: 52px;
            height: 100%;
            justify-content: center;
            align-items: center;
            background-color: $open-red;
            
            font-family: $font-swis721;
            font-size: 30px;
            font-weight: 700;
            line-height: 36px;
            letter-spacing: 0em;
            text-align: center;
            
            color: rgba(19, 19, 19, 1);
            
        }
        
        &__right {
            flex-grow: 2;
            background-image: url("../../img/site/open/checkers-bg.png");
            background-repeat: no-repeat;
            background-size: contain;
            background-position: right bottom;
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