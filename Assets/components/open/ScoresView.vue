<template>
    <div>
        <div v-if="hover">
            <TeamToolTip
                v-for="team in filteredTeams"
                :key="team.ID"
                :team="team"
                :style="{ 'top': `${y + 10}px`, 'left': `${x + 10}px`}"
            />
        </div>
        <div v-if="maphover">
            <MapToolTip
                :map="filteredMap"
                :style="{ 'top': `${y + 10}px`, 'left': `${x + 10}px`}"
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
            <div class="scores__wrapper">
                <table class="scores__table">
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
                                    @mousemove="getCursor($event)"
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
                        <tr
                            v-for="row in shownQualifierScoreViews"
                            :key="row.ID"
                            :class="{ 
                                'scores__table--tier1': row.placement <= 8 && syncView === 'teams',
                                'scores__table--tier2': row.placement > 8 && row.placement <= 24 && syncView === 'teams',
                            }"
                        >
                            <td>#{{ row.placement }}</td>
                            <td
                                class="scores__table--background-image"
                                :style="{ 'background-image': `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(${row.avatar})` }"
                                @mousemove="getCursor($event)"
                                @mouseenter="hover = true; searchID = row.ID.toString()"
                                @mouseleave="hover = false"
                            >
                                <a
                                    :href="syncView === 'players' ? `https://osu.ppy.sh/users/${row.ID}` : `https://open.corsace.io/team/${row.ID}`"
                                    target="_blank"
                                    class="scores__table--click scores__table--no_padding"
                                >
                                    {{ row.name }}
                                </a>
                            </td>
                            <td v-if="syncView === 'players'">
                                <a
                                    :href="`https://open.corsace.io/team/${row.teamID}`"
                                    target="_blank"
                                    class="scores__table--click scores__table--no_padding"
                                >
                                    {{ row.team }}
                                </a>
                            </td>
                            <td>{{ row.best }}</td>
                            <td>{{ row.worst }}</td>
                            <td>{{ row.sum === 0 ? "" : row[currentFilter].toFixed(currentFilter === "sum" || currentFilter === "average" ? 0 : 2) }}{{ currentFilter.includes("percent") && row.sum !== 0 ? "%" : "" }}</td>
                            <td 
                                v-for="score in row.scores"
                                :key="score.map"
                                :class="{ 'scores__table--highlight': score.isBest }"
                            >
                                {{ score.sum === 0 ? "" : score[currentFilter].toFixed(currentFilter === "sum" || currentFilter === "average" ? 0 : 2) }}{{ currentFilter.includes("percent") && score.sum !== 0 ? "%" : "" }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync} from "vue-property-decorator";
import { namespace } from "vuex-class";
import { QualifierScore, QualifierScoreView, sortType, filters, mapNames, computeQualifierScoreViews } from "../../../Interfaces/qualifier";
import { Tournament } from "../../../Interfaces/tournament";
import { Mappool as MappoolInterface } from "../../../Interfaces/mappool";

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

    @openModule.State tournament!: Tournament | null;
    @openModule.State qualifierScores!: QualifierScore[] | null;
    @openModule.State teamList!: TeamList[] | null;

    mappoolList: MappoolInterface[] = [];
    index = 0;
    
    get selectedMappool (): MappoolInterface | null {
        return this.mappoolList[this.index] || null;
    }

    x = 0;
    y = 0;
    
    getCursor (event) {
        this.x = event.clientX;
        this.y = event.clientY;
    }
    
    loading = true;
    searchID = "";
    mapSearchID = "";
    
    get filteredTeams () {
        if (!this.searchID)
            return this.teamList;
        return this.teamList?.filter(team => 
            team.ID.toString() == this.searchID.toLowerCase()
        );
    }

    get filteredMap () {
        if (!this.mapSearchID)
            return null;
        return this.selectedMappool?.slots.filter(map => 
            this.mapSearchID.toLowerCase().includes(map.acronym.toLowerCase())
        )[0].maps[+(this.mapSearchID.match(/(\d+)/)?.[0] || 1) - 1];
    }

    

    
    
    async mounted () {
        this.loading = true;
        if (this.tournament)
            await this.$store.dispatch("open/setTeamList", this.tournament.ID);
        this.loading = false;

        this.mappoolList = this.tournament?.stages.flatMap(s => [...s.mappool, ...s.rounds.flatMap(r => r.mappool)]) || [];
        this.index = this.mappoolList.findIndex(m => m.isPublic);
        // this.index = this.mappoolList.findLastIndex(m => m.isPublic);
    }
    hover = false;
    maphover = false;

    currentFilter: sortType = "zScore";
    sortDir: "asc" | "desc" = "desc";
    mapSort = -1;
    filters: sortType[] = filters;

    get mapNameList (): {
        map: string;
        mapID: number;
    }[] {
        return mapNames(this.qualifierScores);
    }

    get useAvg (): boolean {
        return this.currentFilter === "average" || this.currentFilter === "relAvg" || this.currentFilter === "percentAvg";
    }

    get shownQualifierScoreViews (): QualifierScoreView[] {
        return this.syncView === "players" ? this.playerQualifierScoreViews : this.teamQualifierScoreViews;
    }

    get playerQualifierScoreViews (): QualifierScoreView[] {
        return computeQualifierScoreViews(
            score => ({ id: score.userID, name: score.username, avatar: `https://a.ppy.sh/${score.userID}` }),
            this.qualifierScores,
            this.syncView,
            this.currentFilter,
            this.mapSort,
            this.sortDir
        );
    }

    get teamQualifierScoreViews (): QualifierScoreView[] {
        return computeQualifierScoreViews(
            score => ({ id: score.teamID, name: score.teamName, avatar: score.teamAvatar }),
            this.qualifierScores,
            this.syncView,
            this.currentFilter,
            this.mapSort,
            this.sortDir
        );
    }

    get teamGroupedScores (): QualifierScore[][] {
        if (!this.qualifierScores)
            return [];

        const groupedScores: QualifierScore[][] = [];
        const teamIDs = new Set(this.qualifierScores.map(s => s.teamID));

        for (const teamID of teamIDs)
            groupedScores.push(this.qualifierScores.filter(s => s.teamID === teamID));

        return groupedScores;
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
            font-family: $font-ggsans;
            font-weight: 500;
            padding: 0 30px 5px 30px;
            
            &:hover, &--active {
                color: $open-red;
            }

            &--active::after {
                content: "";
                position: absolute;
                top: calc(50% - 10px/2);
                right: calc(100% - 20px);
                width: 4.5px;
                height: 4.5px;
                transform: rotate(-45deg);
                background-color: $open-red;
            }
        }

        &_subtext {
            display: flex;
            align-items: center;
            font-family: $font-swis721;
            font-weight: 400;
            font-size: $font-sm;
            padding: 0 80px 5px 30px;
        }
    }

    &__wrapper {
        padding: 0;
        height: 100%;
        margin-top: 15px;
        border-left: 1px solid #383838;
        border-right: 1px solid #383838;
        overflow: scroll;
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }

    &__wrapper::-webkit-scrollbar {
        display: none; /*Chrome*/
    }
    &__table {
        font-family: $font-ggsans;
        width: 100%;
        border-collapse: collapse;
        box-sizing: border-box;

        &--highlight{
            color: #FBBA20;
        }

        &--background-image {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }

        &--asc {
            width: 0;
            height: 0;
            border-left: 4.5px solid transparent;
            border-right: 4.5px solid transparent;
            border-top: 4.5px solid #FBBA20;
        }

        &--desc {
            width: 0;
            height: 0;
            border-left: 4.5px solid transparent;
            border-right: 4.5px solid transparent;
            border-bottom: 4.5px solid #FBBA20;
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
            // padding: 15px 5px;
        }

        &--no_padding {
            padding: 0;
        }

        &--tier1 {
            background-color: rgba(251, 186, 32, 0.1);
        }
        
        &--tier2 {
            background-color: rgba(255, 255, 255, 0.05);
        }
    }

    &__table th {
        font-size: $font-sm;
        font-weight: 700;
        border-bottom: 1px solid #383838;
        border-left: 1px solid #383838;
    }

    &__table th:first-child {
        border-left: 0;
        border-right: 0;
    }

    &__table td {
        font-size: 0.70rem; /* i tried $font-xsm but its too small*/
        font-weight: 600;
        text-align: center;
        padding: 15px 20px;
        border-bottom: 1px solid $open-red;
        border-left: 1px solid #383838;
    }

    &__table td:first-child {
        border-left: 0;
        border-right: 0;
    }
}
</style>