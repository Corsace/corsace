<template>
    <div 
        v-if="matchupSync"
        class="schedule_matchbox"
    >
        <div class="schedule_matchbox_date">
            <div class="schedule_matchbox_date__ID">
                ID: {{ matchupSync.matchID }}
            </div>
            <div class="schedule_matchbox_date__month">
                {{ formatDate(matchupSync.date) }}
            </div>
            <OpenMatchupTime
                :date="matchupSync.date"
                timezone="UTC"
            />
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

import { MatchupList } from "../../../Interfaces/matchup";

import IconButton from "./IconButton.vue";
import OpenMatchupTime from "./OpenMatchupTime.vue";
import ScheduleMatchBoxTeam from "./ScheduleMatchBoxTeam.vue";

@Component({
    components: {
        IconButton,
        OpenMatchupTime,
        ScheduleMatchBoxTeam,
    },
})
export default class ScheduleMatchBox extends Vue {
    @PropSync("matchup", { default: null }) matchupSync!: MatchupList | null;

    formatDate (date: Date): string {
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const day = date.getUTCDate();
        const monthIndex = date.getUTCMonth();
        return `${months[monthIndex]} ${day < 10 ? "0" : ""}${day} (${date.toLocaleString("en-US", { weekday: "short" }).toUpperCase()})`;
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
    background: linear-gradient(0deg, $open-dark, $open-dark), linear-gradient(0deg, #383838, #383838);
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

        &__ID {
            font-size: 18px;
            font-weight: 600;
            color: $open-red;
        }

        &__month {
            font-size: 21px;
            font-weight: 700;
            font-stretch: condensed;
            color: rgba(235, 235, 235, 1);
        }
    }

    &_teams {
        display: flex;
        width: 100%;
        color: $open-dark;
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