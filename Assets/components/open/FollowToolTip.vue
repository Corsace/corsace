<template>
    <div class="team_tooltip">
        <div class="team_tooltip__top_left" />
        <div
            class="team_tooltip__banner"
            :style="{ 'background-image': `url(${teamSync.avatarURL || require('../../img/site/open/team/default.png')})` }"
        />
        <div class="team_tooltip__list">
            <li 
                v-for="member in teamSync.members"
                :key="member.ID"
                class="team_tooltip__list__item"
                :class="{ 'team_tooltip__list__item--leader': member.isManager }"
            >
                <div class="team_tooltip__list__item--text">
                    {{ member.username }}
                </div>
                <div class="team_tooltip__list__item--text team_tooltip__list__item--text--bws">
                    {{ Math.round(member.BWS) }} {{ $t("open.components.openCardTeam.bws") }}
                </div>
            </li>
        </div>
        <div class="team_tooltip__bottom_left" />
    </div>
<!--         
        <ul class="followtooltip_overlay">
            <div
                class="followtooltip__team_banner"
                :style="{ 'background-image': `url(${teamSync.avatarURL || require('../../img/site/open/team/default.png')})` }"
            />
            <li 
                v-for="member in teamSync.members"
                :key="member.ID"
                class="followtooltip_overlay__list_item"
                :class="{ 'followtooltip_overlay__list_item--leader': member.isManager }"
            >
                <div class="followtooltip_overlay__list_item_text">
                    {{ member.username }}
                </div>
                <div class="followtooltip_overlay__list_item_text followtooltip_overlay__list_item_text--bws">
                    {{ Math.round(member.BWS) }} {{ $t("open.components.openCardTeam.bws") }}
                </div>
            </li>
            <li 
                v-for="member in teamSync.members"
                :key="member.ID"
                class="followtooltip_overlay__list_item"
                :class="{ 'followtooltip_overlay__list_item--leader': member.isManager }"
            >
                <div class="followtooltip_overlay__list_item_text">
                    {{ member.username }}
                </div>
                <div class="followtooltip_overlay__list_item_text followtooltip_overlay__list_item_text--bws">
                    {{ Math.round(member.BWS) }} {{ $t("open.components.openCardTeam.bws") }}
                </div>
            </li>
            <li 
                v-for="member in teamSync.members"
                :key="member.ID"
                class="followtooltip_overlay__list_item"
                :class="{ 'followtooltip_overlay__list_item--leader': member.isManager }"
            >
                <div class="followtooltip_overlay__list_item_text">
                    {{ member.username }}
                </div>
                <div class="followtooltip_overlay__list_item_text followtooltip_overlay__list_item_text--bws">
                    {{ Math.round(member.BWS) }} {{ $t("open.components.openCardTeam.bws") }}
                </div>
            </li>
        </ul>
    </div> -->
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import { TeamList } from "../../../Interfaces/team";

@Component({
    components: {
    },
})

export default class FollowToolTip extends Vue {
    @PropSync("team", { type: Object }) teamSync!: TeamList;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.team_tooltip {
    display: flex;
    flex-direction: column;

    background: linear-gradient(0deg, #131313, #131313),
    linear-gradient(0deg, #353535, #353535);
    background: #131313;

    border: 1px solid #353535;

    width: 155px;
    height: 170px;

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
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 8px 8px 0 0;
        border-color: $open-red transparent transparent transparent;
    }

    &__banner {
        display: flex;
        width: 140px;
        height: 31px;
        padding-top: 5px;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
    }

    &__list {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 80%;
        align-items: center;
        padding-left: 10px;

        &__item {
            display: flex;
            flex-direction: row;
            width: 75%;

            &--leader {
                position: relative;
                &:after {
                    content: "";
                    background-image: url('../../img/site/open/team/manager.svg');
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


.followtooltip {
    display: flex;
    position: relative;
    flex-direction: column;
    flex-basis: calc(100% / 3 - 20px);
    // justify-content: space-between;
    background: #171B1E;
    height: 200px;
    width: 200px;
    align-items: center;
    justify-content: center;

    border: 1px solid #353535;    

    background-image: url("../../img/site/open/checkers-bg.png");
    background-repeat: no-repeat;
    background-size: cover;
    background-position: bottom;
    overflow: hidden;

    &__top_left {
        display: flex;
        position: absolute;
        margin: 1px;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 8px 8px 0 0;
        border-color: $open-red transparent transparent transparent;

    }

    &__team_banner {
            display: flex;
            width: 95%;
            padding-top: 5px;
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            // clip-path: polygon(3% 0, 100% 0, 100% 100%, 0 100%, 0 3%);
        }
    
    &_overlay {
        position: relative;
        width: 100%;
        height: 100%;
        z-index: 1;
        
        &__list {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;

            &_item {
                display: flex;
                justify-content: space-between;
                width: 75%;

                &--leader {
                    position: relative;
                    &:after {
                        content: "";
                        background-image: url('../../img/site/open/team/manager.svg');
                        background-size: 100%;
                        background-repeat: no-repeat;
                        width: 8.4px;
                        height: 5.5px;
                        position: absolute;
                        left: -12px;
                        top: 4px;


                    }
                }

                &_text {
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
}
</style>