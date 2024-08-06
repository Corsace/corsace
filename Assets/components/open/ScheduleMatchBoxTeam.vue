<template>
    <div
        v-if="teamSync"
        class="schedule_matchbox_team"
    >
        <div
            class="schedule_matchbox_team__avatar" 
            :style="{ 'backgroundImage': `url(${teamSync.avatarURL || require('../../../Assets/img/site/open/team/default.png')})` }" 
        />
        <div class="schedule_matchbox_team_details schedule_matchbox_team_details--overlay">
            <div class="schedule_matchbox_team_details__name schedule_matchbox_team_details__name--overlay">
                {{ teamSync.name }}
            </div>
            <ul class="schedule_matchbox_team__members">
                <li 
                    v-for="member in teamSync.members"
                    :key="member.ID"
                    class="schedule_matchbox_team__member"
                    :class="{ 'schedule_matchbox_team__member_leader': member.isCaptain }"
                >
                    <div class="schedule_matchbox_team__member_username">
                        {{ member.username }}
                    </div>
                    <div class="schedule_matchbox_team__member_rank">
                        #{{ Math.round(member.rank) }}
                    </div>
                </li>
            </ul>
        </div>
        <div class="schedule_matchbox_team_details">
            <div class="schedule_matchbox_team_details__name">
                {{ teamSync.name }}
            </div>
            <div class="schedule_matchbox_team_details_teamrank">
                <div class="schedule_matchbox_team--title schedule_matchbox_team--title_soft">
                    {{ $t('open.components.openCardTeam.rank') }}
                </div>
                <div class="schedule_matchbox_team_details_teamrank__rank">
                    {{ Math.round(teamSync.rank) }}
                </div>
            </div>
            <div class="schedule_matchbox_team_details_teambws">
                <div class="schedule_matchbox_team--title schedule_matchbox_team--title_soft">
                    {{ $t('open.components.openCardTeam.teambwsAverage') }}
                </div>
                <div class="schedule_matchbox_team_details_teambws__bws">
                    {{ Math.round(teamSync.BWS) }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, PropSync, Vue } from "vue-property-decorator";
import { TeamList } from "../../../Interfaces/team";

@Component({})
export default class ScheduleMatchBoxTeam extends Vue {
    @PropSync("team", { default: null }) teamSync!: TeamList | null;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

$avatar-width: 129px;

.schedule_matchbox_team {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: row;
    height: 100%;
    white-space: nowrap;

    &__avatar {
        width: $avatar-width;
        height: 100%;
        overflow: hidden;
        
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        border: 1px solid $open-red;
        border-top: 0;
        border-bottom: 0;
        border-left: 0;
    }

    &__members {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
    }

    &__member {
        display: flex;
        justify-content: space-between;
        width: 75%;

        &_leader {
            position: relative;

            &:after {
                content: "";
                background-image: url('../../img/site/open/team/captain.svg');
                background-size: 100%;
                width: 12px;
                height: 8px;
                background-repeat: no-repeat;
                position: absolute;
                left: -25px;
                top: 5px;
            }
        }

        &_username, &_rank {
            list-style: none;
            font-size: 12px;
        }

        &_bws {
            color: $open-red;
            font-size: 10.38px;
            font-weight: 700;
            font-stretch: condensed;
        }
    }

    &_details {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 15px;

        &--overlay {
            position: absolute;
            width: calc(100% - #{$avatar-width});
            height: 100%;
            left: $avatar-width;
            background-image: linear-gradient(0deg, #171B1EDB, #2F2F2FDB), linear-gradient(0deg, #FFF, #FFF);
            z-index: 1;
            opacity: 0;
            transition: opacity 0.3s;

            &:hover {
                opacity: 1;
            }
        }

        &__name {
            font-size: 28px;
            font-weight: 700;
            line-height: 37px;
            letter-spacing: 0em;
            text-align: left;

            &--overlay {
                color: white;
            }
        }
        &_teamrank {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;
            
            &__rank {
                font-size: 21px;
                font-weight: 700;
                line-height: 25px;
                letter-spacing: 0em;
                text-align: center;
                font-stretch: condensed;
            }
        }
        &_teambws {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;

            &__bws {
                font-size: 21px;
                font-weight: 700;
                line-height: 25px;
                letter-spacing: 0em;
                text-align: left;
                font-stretch: condensed;
            }
        }

    }

    &--title {
        font-size: 12px;
        font-weight: 600;
        text-align: left;
        color: $open-red;

        &_soft {
            font-weight: normal;
            letter-spacing: -0.07em;
        }
    }
}
</style>