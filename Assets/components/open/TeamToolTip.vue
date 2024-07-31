<template>
    <div class="team_tooltip">
        <div class="team_tooltip__top_left" />
        <div
            v-if="playerSync"
            class="team_tooltip__list"
        >
            <li 
                v-for="member in teamSync.members"
                :key="member.ID"
                class="team_tooltip__list__item"
                :class="{ 'team_tooltip__list__item--leader': member.isCaptain }"
            >
                <div class="team_tooltip__list__item--text">
                    {{ member.username }}
                </div>
                <div class="team_tooltip__list__item--text team_tooltip__list__item--text--rank">
                    #{{ Math.round(member.rank) }}
                </div>
            </li>
        </div>
        <div class="team_tooltip__bottom_info">
            <div class="team_tooltip__teamname">
                {{ teamSync.name }}
            </div>
            <div class="team_tooltip__ranking">
                <div>
                    RANK: {{ Math.round(teamSync.rank) }}
                </div>
                <div>
                    BWS: {{ Math.round(teamSync.BWS) }}
                </div>
            </div>
        </div>
        <div class="team_tooltip__red_line" />
        <div
            class="team_tooltip__avatar"
            :style="{ 'background-image': `radial-gradient(transparent, rgba(0,0,0,0.33)), url(${teamSync.avatarURL || require('../../img/site/open/team/default.png')})` }"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import { TeamList } from "../../../Interfaces/team";

@Component({
    components: {
    },
})

export default class TeamToolTip extends Vue {
    @PropSync("team", { type: Object }) teamSync!: TeamList;
    @PropSync("player", { type: Object, default: true}) playerSync!: boolean;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.team_tooltip {
    transition: none;
    display: flex;
    flex-direction: column;

    background: $open-dark;

    width: 250px;

    align-items: center;

    pointer-events: all;

    font-family: $font-univers;

    &__top_left {
        position: absolute;
        top: 4px;
        left: 4px;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 14px 14px 0 0;
        border-color: $open-red transparent transparent transparent;
    }
    
    &__list {
        display: flex;
        flex-direction: column;
        margin: 15px;
        width: calc(100% - 30px);
        align-items: center;
        padding-left: 10px;
        gap: 5px;
        
        &__item {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
            gap: 5px;

            &--leader {
                position: relative;
                &:after {
                    content: "";
                    background-image: url('../../img/site/open/team/captain.svg');
                    background-size: 100%;
                    background-repeat: no-repeat;
                    width: 8.4px;
                    height: 5.5px;
                    position: absolute;
                    left: -12px;
                    top: 4px;
                }
            }

            &--text {
                list-style: none;
                font-size: $font-xsm;
                font-weight: 400;
                line-height: 13px;
                letter-spacing: 0em;
                text-align: left;

                &--rank {
                    color: $open-red;
                    font-size: $font-xsm;
                    font-stretch: condensed;
                    font-weight: 700;
                    line-height: 8px;
                    letter-spacing: 0em;
                    text-align: right;
                    align-self: center;
                }
            }
        }
    }

    &__bottom_info {
        display: flex;
        justify-content: space-between;
        padding: 10px;
        width: 100%;
        height: 20%;
        background-color: white;
    }

    &__teamname {
        font-size: $font-sm;
        font-weight: bold;
        text-align: left;
        align-self: flex-end;
        color: black;
    }

    &__ranking {
        display: flex;
        flex-direction: column;
        gap: 3px;
        
        color: $open-red;
        
        font-size: $font-sm;
        font-stretch: condensed;
        font-weight: bold;
        text-align: right;
    }

    &__red_line {
        background-color: $open-red;
        width: 100%;
        height: 10px;
    }

    &__avatar {
        display: flex;
        height: 50px;
        width: 100%;
        z-index: 0;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
    }
}
</style>