<template>
    <div>
        <div
            ref="teamToolTip"
            style="position: fixed; transition: none; z-index: 10;"
        >
            <TeamToolTip
                v-if="hover && filteredTeam"
                :team="filteredTeam"
                :player="showPlayers"
            />
        </div>
        <div
            ref="mapToolTip"
            style="position: fixed; transition: none; z-index: 10;"
        >
            <MapToolTip
                v-if="maphover && filteredMap"
                :map="filteredMap"
            />
        </div>
        <div
            class="scores"
        >
            <div class="scores__sub_header">
                <div class="scores__sub_header_subtext">
                    {{ $t('open.qualifiers.scores.nav.sort') }}
                </div>
                <div 
                    v-for="filter in filters"
                    :key="filter"
                    class="scores__sub_header_item"
                    :class="{ 'scores__sub_header_item--active': currentFilter === filter }"
                    @click="currentFilter = filter"
                >
                    {{ $t(`open.qualifiers.scores.nav.${filter}`) }}
                </div>
            </div>
            <hr class="line--red line--bottom-space">
            <!-- Top scrollbar container -->
            <div 
                ref="scrollWrapperTop"
                class="scores__wrapper"
            >
                <div
                    ref="fake"
                    class="scores__wrapper_fake"
                />
            </div>
            <div
                ref="scrollWrapperBottom"
                class="scores__wrapper"
            >
                <table
                    ref="table"
                    class="scores__table"
                >
                    <tbody>
                        <tr>
                            <th> {{ $t('open.qualifiers.scores.nav.placement') }} </th>
                            <th v-if="syncView === 'players'">
                                {{ $t('open.qualifiers.scores.nav.player') }}
                            </th>
                            <th> {{ $t('open.qualifiers.scores.nav.team') }} </th>
                            <th> {{ $t('open.qualifiers.scores.nav.best') }} </th>
                            <th> {{ $t('open.qualifiers.scores.nav.worst') }} </th>
                            <th @click="mapSort = -1; sortDir = sortDir === 'asc' ? 'desc' : 'asc';">
                                <div class="scores__table--click">
                                    {{ $t(`open.qualifiers.scores.nav.${currentFilter}`) }}
                                    <div
                                        :class="{ 
                                            'scores__table--asc': mapSort === -1 && sortDir === 'asc', 
                                            'scores__table--desc': mapSort === -1 && sortDir === 'desc', 
                                            'scores__table--none': mapSort !== -1 || (sortDir !== 'asc' && sortDir !== 'desc')
                                        }"
                                    />
                                </div>
                            </th>
                            <th
                                v-for="(map, i) in mapNameList"
                                :key="map.mapID"
                                @click="mapSort = i; sortDir = sortDir === 'asc' ? 'desc' : 'asc';"
                            >
                                <div
                                    class="scores__table--click"
                                    @mousemove="updateTooltipPosition($event)"
                                    @mouseenter="maphover = true; mapSearchID = map.map"
                                    @mouseleave="maphover = false"
                                >
                                    {{ map.map }}
                                    <div
                                        :class="{ 
                                            'scores__table--asc': mapSort === i && sortDir === 'asc',
                                            'scores__table--desc': mapSort === i && sortDir === 'desc',
                                            'scores__table--none': mapSort !== i || (sortDir !== 'asc' && sortDir !== 'desc')
                                        }"
                                    />
                                </div>
                            </th>
                        </tr>
                        <!-- TODO: Don't hardcode tiers -->
                        <tr
                            v-for="row in shownQualifierScoreViews"
                            :key="row.ID"
                            :class="{ 
                                'scores__table--tier1': tierSync && (keepPlacementLocked ? row.truePlacement <= 4 : row.sortPlacement <= 4) && syncView === 'teams',
                                'scores__table--tier2': tierSync && (keepPlacementLocked ? row.truePlacement > 4 && row.truePlacement <= 16 : row.sortPlacement > 4 && row.sortPlacement <= 16) && syncView === 'teams'
                            }"
                        >
                            <td>#{{ keepPlacementLocked ? row.truePlacement : row.sortPlacement }}</td>
                            <!-- THE TEAM / PLAYER COLUMN -->
                            <a
                                :href="syncView === 'players' ? `https://osu.ppy.sh/users/${row.ID}` : `https://open.corsace.io/team/${row.ID}`"
                                target="_blank"
                                class="scores__table_team"
                                :style="{ 'background-image': `linear-gradient(90deg, transparent 0%, #EF3255 45%), url(${row.avatar || require('../../img/site/open/team/default.png')})` }"
                                @mousemove="updateTooltipPosition($event)"
                                @mouseenter="hover = true; syncView === 'players' ? (showPlayers = false, teamSearchID = row.teamID): (showPlayers = true, teamSearchID = row.ID); "
                                @mouseleave="hover = false; showPlayers = true"
                            >
                                {{ row.name }}
                                <div class="scores__table_white" />
                            </a>
                            <a
                                v-if="syncView === 'players'"
                                :href="`https://open.corsace.io/team/${row.teamID}`"
                                target="_blank"
                                class="scores__table_team"
                                :style="{ 'background-image': `linear-gradient(90deg, transparent 0%, #EF3255 45%), url(${row.teamAvatar || require('../../img/site/open/team/default.png')})` }"
                                @mousemove="updateTooltipPosition($event)"
                                @mouseenter="hover = true; teamSearchID = row.teamID"
                                @mouseleave="hover = false"
                            >
                                {{ row.team }}
                                <div class="scores__table_white" />
                            </a>
                            <td
                                @mousemove="updateTooltipPosition($event)"
                                @mouseenter="maphover = true; mapSearchID = row.best"
                                @mouseleave="maphover = false"    
                            >
                                {{ row.best }}
                            </td>
                            <td
                                @mousemove="updateTooltipPosition($event)"
                                @mouseenter="maphover = true; mapSearchID = row.worst"
                                @mouseleave="maphover = false"    
                            >
                                {{ row.worst }}
                            </td>
                            <td>{{ numberFormats[currentFilter](row[currentFilter], row.score === 0) }}</td>
                            <td 
                                v-for="score in row.scores"
                                :key="score.map"
                                :class="{ 'scores__table--highlight': score.isBest }"
                            >
                                {{ numberFormats[currentFilter](score[currentFilter], score.score === 0) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { MatchupScore, MatchupScoreView, computeScoreViews, mapNames, scoreFilters, scoreSortType, numberFormats } from "../../../Interfaces/matchup";
import { Tournament } from "../../../Interfaces/tournament";
import { Mappool } from "../../../Interfaces/mappool";
import { TeamList } from "../../../Interfaces/team";

import TeamToolTip from "./TeamToolTip.vue";
import MapToolTip from "./MapToolTip.vue";

const openModule = namespace("open");

@Component({
    components: {
        TeamToolTip,
        MapToolTip,
    },
})

export default class ScoresView extends Vue {
    @PropSync("view", { type: String }) syncView!: "players" | "teams";
    @PropSync("placementLock", { type: Boolean, default: false }) keepPlacementLocked!: boolean;
    @PropSync("pool", { default: null }) readonly selectedMappool!: Mappool | null;
    @PropSync("tiers", { type: Boolean, default: false }) readonly tierSync!: boolean;
    @PropSync("default",{ type: String, default: "score" }) readonly defaultView!: scoreSortType;

    @openModule.State tournament!: Tournament | null;
    @openModule.State scores!: MatchupScore[] | null;
    @openModule.State teamList!: TeamList[] | null;

    updateTooltipPosition (event: MouseEvent) {
        const x = event.clientX;
        const y = event.clientY;

        if (this.$refs.teamToolTip instanceof HTMLElement) {
            this.$refs.teamToolTip.style.left = `${x + 10}px`;
            this.$refs.teamToolTip.style.top = `${y + 10}px`;
        }
        if (this.$refs.mapToolTip instanceof HTMLElement) {
            this.$refs.mapToolTip.style.left = `${x + 10}px`;
            this.$refs.mapToolTip.style.top = `${y + 10}px`;
        }
    }
    
    loading = true;
    teamSearchID: number | undefined = 0;
    mapSearchID = "";

    numberFormats = numberFormats;
    
    get filteredTeam () {
        if (!this.teamSearchID)
            return null;
        return this.teamList?.find(team => 
            team.ID == this.teamSearchID
        );
    }

    get filteredMap () {
        if (!this.mapSearchID)
            return null;
        return this.selectedMappool?.slots.filter(map => 
            this.mapSearchID.toLowerCase().includes(map.acronym.toLowerCase())
        )[0]?.maps[+(this.mapSearchID.match(/(\d+)/)?.[0] ?? 1) - 1];
    }
    
    async mounted () {
        if (this.defaultView)
            this.currentFilter = this.defaultView;

        this.loading = true;
        if (this.tournament && (!this.teamList || this.teamList.length === 0))
            await this.$store.dispatch("open/setTeamList", this.tournament.ID);
        this.loading = false;

        const topScroll = this.$refs.scrollWrapperTop as HTMLElement;
        const bottomScroll = this.$refs.scrollWrapperBottom as HTMLElement;

        topScroll.onscroll = () => {
            bottomScroll.scrollLeft = topScroll.scrollLeft;
        };

        bottomScroll.onscroll = () => {
            topScroll.scrollLeft = bottomScroll.scrollLeft;
        };

        // Set fake width to match table width every time the table width changes
        const table = this.$refs.table as HTMLElement;
        const fake = this.$refs.fake as HTMLElement;
        const observer = new ResizeObserver(() => {
            fake.style.width = `${table.clientWidth}px`;
        });
        observer.observe(table);
    }
    hover = false;
    maphover = false;
    showPlayers = true;

    currentFilter: scoreSortType = "score";
    sortDir: "asc" | "desc" = "desc";
    mapSort = -1;
    filters: scoreSortType[] = scoreFilters;

    get mapNameList (): {
        map: string;
        mapID: number;
    }[] {
        return mapNames(this.scores);
    }

    get useAvg (): boolean {
        return this.currentFilter === "average" || this.currentFilter === "relAvg" || this.currentFilter === "percentAvg";
    }

    get shownQualifierScoreViews (): MatchupScoreView[] {
        return this.syncView === "players" ? this.playerQualifierScoreViews : this.teamQualifierScoreViews;
    }

    get playerQualifierScoreViews (): MatchupScoreView[] {
        return computeScoreViews(
            score => ({ id: score.userID, name: score.username, avatar: `https://a.ppy.sh/${score.userID}` }),
            this.scores,
            this.syncView,
            this.currentFilter,
            this.mapSort,
            this.sortDir,
            this.tournament?.matchupSize ?? 4
        );
    }

    get teamQualifierScoreViews (): MatchupScoreView[] {
        return computeScoreViews(
            score => ({ id: score.teamID, name: score.teamName, avatar: score.teamAvatar }),
            this.scores,
            this.syncView,
            this.currentFilter,
            this.mapSort,
            this.sortDir,
            this.tournament?.matchupSize ?? 4
        );
    }

    get teamGroupedScores (): MatchupScore[][] {
        if (!this.scores)
            return [];

        const groupedScores: MatchupScore[][] = [];
        const teamIDs = new Set(this.scores.map(s => s.teamID));

        for (const teamID of teamIDs)
            groupedScores.push(this.scores.filter(s => s.teamID === teamID));

        return groupedScores;
    }

    validPlacement (index: number, max: number): boolean {
        const row = this.shownQualifierScoreViews[index];
        if (this.keepPlacementLocked)
            return row.placement <= max;
        if (this.sortDir === "asc")
            return index >= (this.shownQualifierScoreViews.length - max);
        return index < max;
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.scores {
    position: relative;

    &__sub_header {
        display: flex;
        justify-content: center;
        margin: 10px 0;
        gap: 40px;
        width: 100%;
        top: 0px;
        background-color: rgba(0, 0, 0, 0);
        color: #C0C0C0;

        &_item {
            position: relative;
            display: flex;
            justify-content: center;

            cursor: pointer;
            width: auto;
            text-decoration: none;
            font-family: $font-univers;
            font-size: $font-base;
            
            &:hover, &--active {
                color: $open-red;
            }

            &--active::after {
                content: "";
                position: absolute;
                margin: auto;
                top: 0;
                bottom: 0;
                left: -10px;
                width: 4.5px;
                height: 4.5px;
                transform: rotate(-45deg);
                background-color: $open-red;
            }
        }

        &_subtext {
            display: flex;
            align-items: center;
            font-stretch: condensed;
            font-size: $font-sm;
            padding: 0 80px 5px 30px;
        }
    }

    &__wrapper {
        padding: 0;
        height: 100%;
        border-left: 1px solid #383838;
        border-right: 1px solid #383838;
        overflow-x: auto;

        &:first-of-type {
            margin-top: 15px;
        }

        &_fake {
            width: 100%;
            height: 1px;
            transition: none;
        }
    }

    &__table th {
        border-bottom: 1px solid #383838;
        border-left: 1px solid #383838;
    }

    &__table th:first-child {
        border-left: 0;
        border-right: 0;
    }

    &__table td {
        border-left: 1px solid #383838;
        border-bottom: 1px solid $open-red;
    }

    &__table td, &__table_team {
        text-align: center;
        padding: 10px 20px;
    }

    &__table td:first-child {
        border-left: 0;
        border-right: 0;
    }

    &__table {
        font-family: $font-univers;
        font-size: $font-sm;
        font-weight: bold;
        width: 100%;
        border-collapse: collapse;
        box-sizing: border-box;
        white-space: nowrap;
        
        &_team {
            background-size: 100%, 50%;
            background-position: center, left center;
            background-repeat: no-repeat;
            display: table-cell;
            font-size: $font-base;
            letter-spacing: 0.08em;
            text-align: right;
            position: relative;

            &:hover {
                text-decoration: none;
            }
        }

        &_white {
            width: 10px;
            height: 100%;
            background-color: white;
            position: absolute;
            right: 0;
            top: 0;
        }

        &--highlight {
            color: #FBBA20;
        }

        &--asc {
            width: 0;
            height: 0;
            border-left: 4.5px solid transparent;
            border-right: 4.5px solid transparent;
            border-top: 4.5px solid $open-red;
        }

        &--desc {
            width: 0;
            height: 0;
            border-left: 4.5px solid transparent;
            border-right: 4.5px solid transparent;
            border-bottom: 4.5px solid $open-red;
        }

        &--none {
            width: 0;
            height: 0;
            border: 4.5px solid #383838;
            transform: rotate(45deg);
        }

        &--click {
            text-decoration: none !important;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            padding: 15px 5px;
        }

        &--no_padding {
            padding: 0;
        }

        &--tier1 {
            background-color: rgba(251, 186, 32, 0.15);
        }
        
        &--tier2 {
            background-color: rgba(255, 255, 255, 0.1);
        }
    }
}
</style>