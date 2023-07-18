<template>
    <NuxtLink
        :to="`/team/${teamSync.ID}`"
        class="open_card_team"
    >
        <div class="open_card_team_overlay">
            <ul class="open_card_team_overlay__list">
                <li 
                    v-for="member in teamSync.members"
                    :key="member.ID"
                    class="open_card_team_overlay__list_item"
                    :class="{ 'open_card_team_overlay__list_item--leader': member.isManager }"
                >
                    <div class="open_card_team_overlay__list_item_text">
                        {{ member.username }}
                    </div>
                    <div class="open_card_team_overlay__list_item_text open_card_team_overlay__list_item_text--bws">
                        {{ Math.round(member.BWS) }} BWS
                    </div>
                </li>
            </ul>
        </div>
        <div
            class="open_card_team__img"
            :style="{ 'backgroundImage': `url(${teamSync.avatarURL || require('../../../Assets/img/site/open/team/default.png')})` }"
        />
        <div class="open_card_team__name">
            {{ teamSync.name }} <span v-if="!teamSync.isRegistered">(UNREGISTERED)</span>
        </div>
        <div class="open_card_team__text">
            <div class="open_card_team__text_group">
                <div class="open_card_team__text_group_label">
                    RANK
                </div>
                <div class="open_card_team__text_group_data">
                    {{ Math.round(teamSync.rank) }}
                </div>
            </div>
            <div class="open_card_team__text_group">
                <div class="open_card_team__text_group_label">
                    TEAM BWS AVG
                </div>
                <div class="open_card_team__text_group_data">
                    {{ Math.round(teamSync.BWS) }}
                </div>
                <div class="open_card_team__text_group_label--vertical">
                    BWS
                </div>
            </div>
        </div>
    </NuxtLink>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import { TeamList } from "../../../Interfaces/team";

@Component
export default class OpenCardTeam extends Vue {
    @PropSync("team", { type: Object }) teamSync!: TeamList;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';

.open_card_team {
    flex-basis: calc(100% / 3 - 20px);
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #171B1E;
    height: 198px;

    &_overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #131313F0;
        z-index: 1;
        opacity: 0;

        &:hover {
            opacity: 1;
        }

        &__list {

            padding: 20px 80px 20px 80px;

            &_item {
                display: flex;
                flex-direction: row;
                justify-content: space-between;

                &--leader {

                    position: relative;

                    &:after{
                        content: "";
                        background-image: url('../../img/site/open/team/manager.svg');
                        background-size: 100%;
                        width: 15px;
                        height: 10px;
                        background-repeat: no-repeat;
                        position: absolute;
                        left: -25px;
                        top: 5px;
                    }
                }

                &_text {

                font-family: $font-ggsans;
                font-weight: 500;
                list-style: none;

                    &--bws {

                        color: $open-red;
                        font-family: $font-swis721;
                        font-weight: 700;
                    }
                }
            }
        }
    }

    &:hover {
        text-decoration: none;
    }

    &__img {
        height: 81%;
        width: 100%;
        object-fit: cover;
        overflow: hidden;
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
    }

    &__name {
        font-family: gg sans;
        font-size: $font-xl;
        font-weight: 700;
        text-align: left;
        text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;
        color: $white;
        margin-left: 15px;

        & span {
            color: $open-red;
            font-size: $font-base;
        }
    }

    &__text {
        height: 57px;
        background: #131313;
        border-top: 1px solid $open-red;
        padding: 0 10px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-image: url('../../../Assets/img/site/open/checkers-bg.png');
        background-repeat: no-repeat;
        background-position: bottom 0px right -5px;

        &_group {
            display: flex;
            flex-direction: row;
            align-items: center;

            &_label {
                color: #131313;
                white-space: nowrap;
                font-family: $font-swis721;
                font-size: 10px;
                font-weight: 700;
                text-align: left;
                height: inherit;
                background: $open-red;
                padding: 1.75px 3.5px;

                &--vertical {
                    font-family: $font-swis721;
                    font-weight: 400;
                    font-size: $font-sm;
                    font-style: italic;
                    color: $open-red;
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                }
            }

            &_data {
                font-family: $font-swis721;
                font-size: $font-xl;
                font-weight: 700;
                font-style: italic;
                margin: 0px 10px 0px 10px
            }
        }
    }
}
</style>