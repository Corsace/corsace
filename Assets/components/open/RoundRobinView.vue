<template>
    <div class="round_robin_view">
        <div
            ref="teamToolTip"
            style="position: fixed; transition: none; z-index: 10;"
        >
            <TeamToolTip
                v-if="hover && filteredTeam"
                :team="filteredTeam"
            />
        </div>
        <div class="round_robin_view__standings">
            <div class="round_robin_view__standings_header">
                {{ $t('open.schedule.brackets.standings') }}
            </div>
            <div
                v-for="(group, i) in groups"
                :key="i"
                class="round_robin_view__standings_group"
            >
                <div
                    class="round_robin_view__standings_group_header"
                    @click="group.collapsed = !group.collapsed"
                >
                    <div class="round_robin_view__standings_group_header__left">
                        <div
                            class="triangle round_robin_view__standings_group_triangle"
                            :class="{ 'round_robin_view__standings_group_triangle--active': !group.collapsed }"
                        />
                        <div class="round_robin_view__standings_group_name">
                            GROUP {{ group.id }}
                        </div>
                    </div>
                    <div
                        class="round_robin_view__standings_group_toBracket"
                        @click.stop="$emit('change', group.id)"
                    >
                        <div
                            v-if="currentGroup === group.id"
                            class="round_robin_view__standings_group_toBracket__diamond"
                        />
                        {{ $t('open.schedule.brackets.toBracket') }}
                    </div>
                </div>
                <div
                    v-if="!group.collapsed"
                    class="round_robin_view__standings_group"
                >
                    <a
                        v-for="(team, j) in group.teams"
                        :key="j"
                        :href="`/team/${team.ID}`"
                        class="round_robin_view__standings_team"
                    >
                        <div class="round_robin_view__standings_team_placement">
                            {{ j + 1 }}.
                        </div>
                        <div
                            class="round_robin_view__standings_team_avatar"
                            :style="{ 'backgroundImage': `url(${team.avatarURL || require('../../img/site/open/team/default.png')})` }"
                        />
                        <div class="round_robin_view__standings_team_name">
                            {{ team.name }}
                        </div>
                        <div class="round_robin_view__standings_team_score">
                            {{ group.matches.filter(m => m.teams && ((m.teams[0] && m.teams[0].ID === team.ID && m.team1Score > m.team2Score) || (m.teams[1] && m.teams[1].ID === team.ID && m.team2Score > m.team1Score))).length }}-{{ group.matches.filter(m => m.teams && ((m.teams[0] && m.teams[0].ID === team.ID && m.team1Score < m.team2Score) || (m.teams[1] && m.teams[1].ID === team.ID && m.team2Score < m.team1Score))).length }}
                        </div>
                    </a>
                </div>
            </div>
        </div>
        <div class="round_robin_view__separator" />
        <table
            v-if="group"
            class="round_robin_view__table"
        >
            <caption>{{ $t('open.schedule.brackets.matches') }}</caption>
            <thead>
                <tr>
                    <th>
                        <div class="round_robin_view__table_header_flex">
                            <div class="round_robin_view__table_header">
                                GROUP {{ group.id }}
                            </div>
                        </div>
                    </th>
                    <th
                        v-for="team in group.teams"
                        :key="team.ID"
                        @mousemove="updateTooltipPosition($event)"
                        @mouseenter="hover = true; teamSearchID = team.ID"
                        @mouseleave="hover = false"
                    >
                        <a 
                            :href="`/team/${team.ID}`"
                            class="round_robin_view__team"
                        >
                            <!-- <div class="round_robin_view__team_rank__container">
                                <div class="round_robin_view__team_rank">
                                </div>
                            </div> -->
                            <div class="round_robin_view__team_box">
                                <div
                                    class="round_robin_view__team_avatar"
                                    :style="{ 'backgroundImage': `url(${team.avatarURL || require('../../img/site/open/team/default.png')})` }"
                                />
                                <div class="round_robin_view__team_name">
                                    {{ team.abbreviation.toUpperCase() }}
                                </div>
                            </div>
                        </a>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="team in group.teams"
                    :key="team.ID"
                >
                    <td
                        @mousemove="updateTooltipPosition($event)"
                        @mouseenter="hover = true; teamSearchID = team.ID"
                        @mouseleave="hover = false"
                    >
                        <a
                            :href="`/team/${team.ID}`"
                            class="round_robin_view__team"
                        >
                            <!-- <div class="round_robin_view__team_rank__container">
                                <div class="round_robin_view__team_rank">
                                </div>
                            </div> -->
                            <div class="round_robin_view__team_box">
                                <div
                                    class="round_robin_view__team_avatar"
                                    :style="{ 'backgroundImage': `url(${team.avatarURL || require('../../img/site/open/team/default.png')})` }"
                                />
                                <div class="round_robin_view__team_name">
                                    {{ team.abbreviation.toUpperCase() }}
                                </div>
                            </div>
                        </a>
                    </td>
                    <td
                        v-for="otherTeam in group.teams"
                        :key="otherTeam.ID"
                        :class="{ 'round_robin_view__invalidMatchup': otherTeam.ID === team.ID }"
                    >
                        <div
                            v-if="otherTeam.ID !== team.ID && group.matches.find(m => m.teams?.some(t => t.ID === team.ID) && m.teams?.some(t => t.ID === otherTeam.ID))"
                            class="round_robin_view__matchup"
                        >
                            <div class="round_robin_view__matchup_upcoming">
                                {{ $t('open.schedule.brackets.upcoming') }}
                                <div class="round_robin_view__matchup_upcoming__xxx">
                                    XXX
                                </div>
                            </div>
                            <div class="round_robin_view__matchup_vs">
                                <div
                                    class="round_robin_view__matchup_vs_avatar"
                                    :style="{ 'backgroundImage': `url(${team.avatarURL || require('../../img/site/open/team/default.png')})` }"
                                />
                                <div class="round_robin_view__matchup_vs_text">
                                    <div class="round_robin_view__matchup__ID_container">
                                        <div class="round_robin_view__matchup__ID">
                                            MATCH: <span>{{ group.matches.find(m => m.teams?.some(t => t.ID === team.ID) && m.teams?.some(t => t.ID === otherTeam.ID))?.matchID }}</span>
                                        </div>
                                    </div>
                                    <div class="round_robin_view__matchup_vs_text__vs">
                                        VS
                                    </div>
                                    <div class="round_robin_view__matchup__datetime">
                                        <div class="round_robin_view__matchup_date">
                                            {{ group.matches.find(m => m.teams?.some(t => t.ID === team.ID) && m.teams?.some(t => t.ID === otherTeam.ID))?.date.toLocaleString('en-US', { month: 'numeric', day: 'numeric', timeZone: 'UTC' }).replace("/", ".") }}
                                        </div>
                                        <div class="round_robin_view__matchup_time">
                                            {{ group.matches.find(m => m.teams?.some(t => t.ID === team.ID) && m.teams?.some(t => t.ID === otherTeam.ID))?.date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: 'UTC' }) }}
                                        </div>
                                    </div>
                                </div>
                                <div
                                    class="round_robin_view__matchup_vs_avatar"
                                    :style="{ 'backgroundImage': `url(${otherTeam.avatarURL || require('../../img/site/open/team/default.png')})` }"
                                />
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync, Watch } from "vue-property-decorator";
import { MatchupList } from "../../../Interfaces/matchup";
import { TeamList } from "../../../Interfaces/team";

import TeamToolTip from "./TeamToolTip.vue";

@Component({
    components: {
        TeamToolTip,
    },
})
export default class RoundRobinView extends Vue {
    @PropSync("matchups", { type: Array, required: true }) matchupList!: MatchupList[];
    @PropSync("current", { type: String, default: "" }) currentGroup!: string;

    updated () {
        const view = document.querySelector(".round_robin_view");
        if (view instanceof HTMLElement)
            view.style.width = `${view.scrollWidth + 2}px`;
    }

    hover = false;
    teamSearchID = 0;

    // TODO: Change how making groups even works in the first place
    get groups (): {
        id: string;
        matches: MatchupList[];
        teams: TeamList[];
        collapsed: boolean;
    }[] {
        const matchIDSet = new Set<string>();
        for (const matchup of this.matchupList)
            if (matchup.matchID[0])
                matchIDSet.add(matchup.matchID[0]);

        return Array.from(matchIDSet).map(id => {
            const matches = this.matchupList.filter(m => m.matchID.startsWith(id));

            const teams: TeamList[] = [];
            for (const matchup of matches)
                if (matchup.teams)
                    for (const team of matchup.teams)
                        if (!teams.find(t => t.ID === team.ID))
                            teams.push(team);
            teams.sort((a, b) => {
                const matchesWonA = matches.filter(m => m.teams && ((m.teams[0] && m.teams[0].ID === a.ID && m.team1Score > m.team2Score) || (m.teams[1] && m.teams[1].ID === a.ID && m.team2Score > m.team1Score))).length;
                const matchesWonB = matches.filter(m => m.teams && ((m.teams[0] && m.teams[0].ID === b.ID && m.team1Score > m.team2Score) || (m.teams[1] && m.teams[1].ID === b.ID && m.team2Score > m.team1Score))).length;
                return matchesWonA > matchesWonB ? -1 : 1;
            });

            return {
                id,
                matches,
                teams,
                collapsed: true,
            };
        }).sort((a, b) => a.id > b.id ? 1 : -1);
    }

    get group () {
        return this.groups.find(g => g.id === this.currentGroup);
    }

    get filteredTeam () {
        return this.group?.teams.find(t => t.ID === this.teamSearchID);
    }

    updateTooltipPosition (event: MouseEvent) {
        const x = event.clientX;
        const y = event.clientY;

        if (this.$refs.teamToolTip instanceof HTMLElement) {
            this.$refs.teamToolTip.style.left = `${x + 10}px`;
            this.$refs.teamToolTip.style.top = `${y + 10}px`;
        }
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.round_robin_view {
    mask-image: linear-gradient(to top, transparent 0, black 10%),
        linear-gradient(to left, transparent 0, black 10%);
    mask-composite: intersect;
    display: flex;
    gap: 25px;

    &__standings {
        display: flex;
        flex-direction: column;
        gap: 25px;
        align-items: flex-start;

        &_header {
            font-weight: bold;
            font-size: $font-sm;
            color: #131313;
            background-color: #EF3255;
            width: fit-content;
            padding: 1px 10px;
        }

        &_group {
            display: flex;
            flex-direction: column;
            justify-content: center;
            width: 300px;

            &_triangle {   
                color: white;
                transform: rotate(270deg);
                border-left: 3px solid transparent;
                border-right: 3px solid transparent;
                border-top: 5px solid;
                border-bottom: none;
                margin-right: 5px;

                &--active {       
                    border-top: none;
                    border-bottom: 5px solid;
                    transform: rotate(180deg);
                }
            }

            &_header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
                font-weight: bold;
                letter-spacing: 0.005em;
                background-color: $open-red;

                &__left {
                    display: flex;
                    align-items: center;
                    padding: 5px;
                }
            }

            &_toBracket {
                font-size: $font-xsm;
                font-weight: normal;
                height: 100%;
                display: flex;
                align-items: center;
                padding: 5px;

                &__diamond {
                    width: 4px;
                    aspect-ratio: 1/1;
                    background: white;
                    transform: rotate(45deg);
                    margin-right: 5px;
                }
            }
        }

        &_team {
            display: flex;
            align-items: center;
            width: 300px;
            height: 25px;
            font-size: $font-sm;
            border-bottom: 2px solid $open-red;
            background: white;

            &:hover {
                text-decoration: none;
            }

            &_placement {
                height: 100%;
                aspect-ratio: 4/5;
                padding: 5px;
                background: linear-gradient(to top, #171B1E, #2F2F2F);
                font-weight: bold;
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            &_avatar {
                height: 100%;
                aspect-ratio: 4/1;
                background-size: cover;
                background-repeat: no-repeat;
                background-position: center;
            }

            &_name {
                padding: 5px;
                display: flex;
                align-items: center;
                color: $open-dark;
            }

            &_score {
                display: flex;
                align-items: center;
                font-size: $font-base;
                font-weight: bold;
                color: $open-red;
                margin-left: auto;
                padding: 5px;
            }
        }
    }

    &__separator {
        width: 2px;
        background: repeating-linear-gradient(to bottom, transparent, transparent 15px, #EF3255 15px, #EF3255 30px);
    }

    &__table {
        border-spacing: 0;
        border-collapse: collapse;
        
        &_header {
            font-size: $font-xxxl;
            font-weight: bold;
            font-stretch: condensed;
            font-style: italic;
            color: white;
            background: $open-red;
            width: 160px;
            height: 15px;
            display: flex;
            justify-content: center;
            align-items: center;

            &_flex {
                display: flex;
                justify-content: center;
                align-items: center;
            }
        }

        & caption {
            font-weight: bold;
            font-size: $font-sm;
            color: #131313;
            background-color: #EF3255;
            width: fit-content;
            padding: 1px 10px;
        }
    }

    &__team {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 165px;
        height: 50px;

        &_rank {
            transform: rotate(45deg);
            font-weight: bold;
            font-style: italic;
            font-stretch: condensed;
            font-size: $font-base;
            color: $open-dark;
            text-align: center;
            
            &__container {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                transform: rotate(-45deg);
                background: $open-red;
            }
        }

        &_box {
            height: 50px;
            width: 125px;
            display: flex;
        }

        &_avatar {
            width: 50px;
            height: 50px;
            border-right: 2px solid $open-red;
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
        }

        &_name {
            width: 75px;
            height: 50px;
            padding: 5px;
            display: flex;
            align-items: center;
            font-size: $font-base;
            font-weight: bold;
            color: $open-dark;
            background: white;
        }
    }

    &__invalidMatchup {
        background: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 10px,
            #891F33 10px,
            #891F33 12px
        );
    }

    &__matchup {
        width: 195px;
        height: 100px;
        display: flex;
        flex-direction: column;

        &_upcoming {
            font-size: $font-lg;
            height: 10px;
            width: 100%;
            font-weight: bold;
            color: white;
            background: $open-red;
            display: flex;
            overflow: hidden;
            align-items: center;

            &__xxx {
                font-size: $font-xsm;
                color: $open-dark;
                padding: 6px;
                letter-spacing: 6px;
            }
        }

        &_vs {
            width: 100%;
            height: calc(100% - 10px);
            display: flex;
            font-weight: bold;

            &_avatar {
                width: 75px;
                height: 100%;
                background-size: cover;
                background-repeat: no-repeat;
                background-position: center;
            }

            &_text {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;

                &__vs {
                    font-size: $font-lg;
                    font-weight: bold;
                    font-stretch: condensed;
                    font-style: italic;
                    width: 110%;
                    height: 10px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    background-color: $open-red;
                    text-align: center;
                    z-index: 4;
                }
            }
        }

        &__ID {
            position: relative;
            top: -1px;
            left: -1px;

            &_container {
                background: linear-gradient(180deg, #FAFAFA 0%, #e3e3e3 100%);
                color: black;
                overflow: hidden;
                font-size: $font-sm;
                line-height: 0.8rem;
                height: 100%;
            }

            & span {
                font-size: $font-base;
                line-height: 0;
            }
        }

        &__datetime {
            background: linear-gradient(180deg, #171B1E 0%, #2F2F2F 100%);
            color: $open-red;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: flex-end;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }

        &_date {
            line-height: calc($font-base - 1px);
        }

        &_time {
            font-size: $font-sm;
            line-height: calc($font-sm - 5px);
        }
    }

    & th {
        width: 195px;
        height: 100px;
        border-bottom: 1px solid #5e5e5e;
        padding: 0;

        &:first-child {
            border-right: 1px solid #5e5e5e;
        }
    }

    & td {
        width: 195px;
        height: 100px;
        padding: 0;
        
        &:first-child {
            border-right: 1px solid #5e5e5e;
        }

        &:not(:first-child) {
            border-right: 1px solid #272727;
            border-bottom: 1px solid #272727;
        }
    }
}
</style>