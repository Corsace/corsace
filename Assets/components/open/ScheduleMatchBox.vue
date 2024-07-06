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
        <div class="schedule_matchbox_teams">
            <ScheduleMatchBoxTeam :team="matchupSync.teams?.[0]" />
            <div 
                class="schedule_matchbox_teams__vs"
                :style="{
                    'background-color': matchupSync.potential ? '#FF5F22' : '#EF3255'
                }"
            >
                VS
            </div>
            <ScheduleMatchBoxTeam :team="matchupSync.teams?.[0]" />
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
import IconButton from "./IconButton.vue";
import ScheduleMatchBoxTeam from "./ScheduleMatchBoxTeam.vue";
import { MatchupList } from "../../../Interfaces/matchup";

@Component({
    components: {
        IconButton,
        ScheduleMatchBoxTeam,
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

    &_teams {
        display: flex;
        width: 100%;
        color: #131313;
        background-color: #FAFAFA;

        &__side {
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