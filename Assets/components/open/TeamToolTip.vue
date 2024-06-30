<template>
    <div class="team_tooltip">
        <div class="team_tooltip__top_left" />
        <div
            class="team_tooltip__banner"
            :style="{ 'background-image': `linear-gradient(rgba(0,0,0,0.66), rgba(0,0,0,0.66)), url(${teamSync.avatarURL || require('../../img/site/open/team/default.png')})` }"
        >
            <div class="team_tooltip__banner_ranking">
                <div class="team_tooltip__banner_ranking__rank">
                    RANK {{ Math.round(teamSync.rank) }}
                </div>
                <div class="team_tooltip__banner_ranking__bws">
                    BWS {{ Math.round(teamSync.BWS) }}
                </div>
            </div>
        </div>
        <div
            class="team_tooltip__list"
        >
            <div class="team_tooltip__list__teamname">
                {{ teamSync.name }}
            </div>
            <div v-if="playerSync">
                <li 
                    v-for="member in teamSync.members"
                    :key="member.ID"
                    class="team_tooltip__list__item"
                    :class="{ 'team_tooltip__list__item--leader': member.isCaptain }"
                >
                    <div class="team_tooltip__list__item--text">
                        {{ member.username }}
                    </div>
                    <div class="team_tooltip__list__item--text team_tooltip__list__item--text--bws">
                        {{ Math.round(member.BWS) }} {{ $t("open.components.openCardTeam.bws") }}
                    </div>
                </li>
            </div>
        </div>
        <div class="team_tooltip__bottom_left" />
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
    z-index: 10;

    background: #131313;

    border: 1px solid #353535;

    width: 175px;
    max-height: 175px;
    padding-bottom: 10px;

    background-image: url("../../img/site/open/checkers-bg.png");
    background-repeat: no-repeat;
    background-size: cover;
    background-position: bottom;

    align-items: center;

    overflow: hidden;

    pointer-events: all;

    &__top_left {
        display: flex;
        position: absolute;
        top: 2px;
        left: 2px;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 8px 8px 0 0;
        border-color: $open-red transparent transparent transparent;

        z-index: 1;
    }
    &__bottom_left {
        display: flex;
        position: absolute;
        bottom: 2px;
        left: 2px;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 8px 0 0 8px;
        border-color: transparent transparent transparent #353535;

        z-index: 1;
    }

    &__banner {
        display: flex;
        width: 95%;
        height: 31px;
        margin-top: 4px;
        z-index: 0;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        clip-path: polygon(0 8.00px, 8.00px 0,100% 0,100% 100%,0 100%);

        &_ranking {
            display: flex;
            position: absolute;
            flex-direction: column;
            top: 0;
            right: 0;
            padding: 3px;
            margin: 7px;
            gap: 3px;
            
            font-family: $font-swis721;
            font-size: 8px;
            font-weight: 700;
            line-height: 7px;
            letter-spacing: 0em;
            text-align: right;

            // text-shadow: 0 0 1px #131313;
            text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;
        }

    }
    
    &__list {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 80%;
        margin-top: -5%;
        align-items: center;
        padding-left: 10px;
        gap: 5px;
        z-index: 3;
        
        &__teamname {
            display: flex;
            width: 75%;
            justify-self: flex-start;
            font-family: $font-ggsans;
            font-size: 12px;
            font-weight: 600;
            line-height: 16px;
            letter-spacing: 0em;
            text-align: right;
    
            text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;
        }
        
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
                font-family: $font-ggsans;
                list-style: none;
                font-size: 10px;
                font-weight: 400;
                line-height: 13px;
                letter-spacing: 0em;
                text-align: left;

                &--bws {
                    color: $open-red;
                    font-family: $font-swis721;
                    font-size: 7px;
                    font-weight: 700;
                    line-height: 8px;
                    letter-spacing: 0em;
                    text-align: right;
                    align-self: center;
                }
            }
        }
    }
}
</style>