<template>
    <div class="schedule_matchbox">
        <div class="schedule_matchbox_date">
            <div class="schedule_matchbox_date__month">
                JUL 30
            </div>
            <div class="schedule_matchbox_date__time">
                15:00
            </div>
            <div class="schedule_matchbox_date__timezone">
                UTC
            </div>
        </div>
        <div class="schedule_matchbox_team">
            <div class="schedule_matchbox_team__left">
                <TeamCard>
                    <template #name>
                        goofy ahh lil jits
                    </template>
                    <template #rank>
                        1
                    </template>
                    <template #bws>
                        99
                    </template>
                </TeamCard>
            </div>
            <div class="schedule_matchbox_team__vs">
                VS
            </div>
            <div class="schedule_matchbox_team__right">
                <TeamCard>
                    <template #name>
                        goofy ahh lil jits
                    </template>
                    <template #rank>
                        1
                    </template>
                    <template #bws>
                        99
                    </template>
                </TeamCard>
            </div>
        </div>
        <div class="schedule_matchbox_links">
            <IconButton link="#">
                <img 
                    class="schedule_matchbox_links__button__twitch"
                    src="../../img/social/twitch-dark.svg"
                >
            </IconButton>
            <IconButton link="#">
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



@Component({
    components: {
        ContentButton,
        TeamCard,
        IconButton,
    },
})
export default class ScheduleMatchBox extends Vue {
    // @PropSync("match", { type: Object }) matchSync!: Match;
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.schedule_matchbox {
    display: flex;
    flex-direction: row;
    background: linear-gradient(0deg, #131313, #131313),
    linear-gradient(0deg, #383838, #383838);
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