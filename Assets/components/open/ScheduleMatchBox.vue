<template>
    <div class="schedule_matchbox">
        <div class="schedule_matchbox_date">
            <div class="schedule_matchbox_date__month">
                <slot name="month" />
            </div>
            <div class="schedule_matchbox_date__time">
                <slot name="time" />
            </div>
            <div class="schedule_matchbox_date__timezone">
                <slot name="timezone" />
            </div>
        </div>
        <div class="schedule_matchbox_team">
            <div class="schedule_matchbox_team__left">
                <slot name="teamcard_left" />
            </div>
            <div class="schedule_matchbox_team__vs">
                VS
            </div>
            <div class="schedule_matchbox_team__right">
                <slot name="teamcard_right" />
            </div>
        </div>
        <div class="schedule_matchbox_links">
            <slot name="links" />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import ContentButton from "./ContentButton.vue";

@Component({
    components: {
        ContentButton,
    },
})
export default class ScheduleMatchBox extends Vue {
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