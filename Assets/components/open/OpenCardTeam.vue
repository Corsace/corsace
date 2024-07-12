<template>
    <NuxtLink
        :to="`/team/${teamSync.ID}`"
        class="open_card_team"
    >
        <ul class="open_card_team__members">
            <li 
                v-for="member in teamSync.members"
                :key="member.ID"
                class="open_card_team__member"
                :class="{ 'open_card_team__member_leader': member.isCaptain }"
            >
                <div class="open_card_team__member_username">
                    {{ member.username }}
                </div>
                <div class="open_card_team__member_rank">
                    #{{ Math.round(member.rank) }}
                </div>
            </li>
        </ul>
        <div
            class="open_card_team__img"
            :style="{ 'backgroundImage': `url(${teamSync.avatarURL || require('../../../Assets/img/site/open/team/default.png')})` }"
        />
        <div class="open_card_team__name">
            {{ teamSync.name }} <span v-if="!registeredSync">({{ $t("open.components.openCardTeam.unregistered") }})</span>
        </div>
        <div class="open_card_team__text">
            <div class="open_card_team__text_group">
                <div class="open_card_team__text_group_label">
                    {{ $t("open.components.openCardTeam.rank") }}
                </div>
                <div class="open_card_team__text_group_data">
                    {{ Math.round(teamSync.rank) }}
                </div>
            </div>
            <div class="open_card_team__text_group">
                <div class="open_card_team__text_group_label">
                    {{ $t("open.components.openCardTeam.teambwsAverage") }}
                </div>
                <div class="open_card_team__text_group_data">
                    {{ Math.round(teamSync.BWS) }}
                </div>
                <div class="open_card_team__text_group_label--vertical">
                    {{ $t("open.components.openCardTeam.bws") }}
                </div>
            </div>
        </div>
    </NuxtLink>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import { Team, TeamList } from "../../../Interfaces/team";

@Component
export default class OpenCardTeam extends Vue {
    @PropSync("team", { type: Object }) teamSync!: Team | TeamList;
    @PropSync("registered", { type: Boolean, default: false }) registeredSync!: boolean;
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
    background: white;
    height: 198px;

    &__members {
        position: absolute;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: #131313F0;
        z-index: 1;
        opacity: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        &:hover {
            opacity: 1;
        }
    }

    &__member {
        display: flex;
        justify-content: space-between;
        width: 50%;

        &_leader {
            position: relative;

            &:after {
                content: "";
                background-image: url('../../img/site/open/team/captain.svg');
                background-size: 100%;
                width: 15px;
                height: 10px;
                background-repeat: no-repeat;
                position: absolute;
                left: -25px;
                top: 5px;
            }
        }

        &_username, &_rank {
            list-style: none;
        }

        &_bws {
            color: $open-red;
            font-weight: 700;
            font-size: 0.8rem;
            font-stretch: condensed;
        }
    }

    &:hover {
        text-decoration: none;
    }

    &__img {
        height: 81%;
        width: 100%;
        border-bottom: 1px solid $open-red;
        object-fit: cover;
        overflow: hidden;
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
    }

    &__name {
        font-size: $font-xl;
        font-weight: 700;
        text-align: left;
        color: black;
        margin-left: 15px;

        & span {
            color: $open-red;
            font-size: $font-base;
        }
    }

    &__text {
        height: 57px;
        padding: 0 10px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: black;

        &_group {
            display: flex;
            flex-direction: row;
            align-items: center;

            &_label {
                color: white;
                white-space: nowrap;
                font-size: 10px;
                font-weight: 700;
                font-stretch: condensed;
                text-align: left;
                height: inherit;
                background: $open-red;
                padding: 1.75px 3.5px;

                &--vertical {
                    font-weight: 400;
                    font-size: $font-sm;
                    font-stretch: condensed;
                    color: $open-red;
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                }
            }

            &_data {
                font-size: calc(1.25 * $font-xxxl);
                font-weight: 700;
                font-stretch: condensed;
                margin: 0px 10px 0px 10px
            }
        }
    }
}
</style>