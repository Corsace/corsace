<template>
    <div class="scores">
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
                        <th>PLACEMENT</th>
                        <th v-if="syncView === 'players'">
                            PLAYER
                        </th>
                        <th>TEAM</th>
                        <th>BEST</th>
                        <th>WORST</th>
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
                            v-for="(map, i) in mapNames"
                            :key="map.mapID"
                            @click="mapSort = i; sortDir = sortDir === 'asc' ? 'desc' : 'asc';"
                        >
                            <div class="scores__table--click">
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
                            'scores__table--tier1': row.placement <= 8,
                            'scores__table--tier2': row.placement > 8 && row.placement <= 24,
                        }"
                    >
                        <td>#{{ row.placement }}</td>
                        <td>{{ row.name }}</td>
                        <td v-if="syncView === 'players'">
                            {{ row.team }}
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
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { QualifierScore, QualifierScoreView } from "../../../Interfaces/qualifier";
import { Tournament } from "../../../Interfaces/tournament";

const openModule = namespace("open");

const filters = ["zScore", "relMax", "percentMax", "relAvg", "percentAvg", "sum", "average"];

type sortType = typeof filters[number];

@Component
export default class ScoresView extends Vue {

    @PropSync("view", { type: String }) syncView!: "players" | "teams";

    @openModule.State tournament!: Tournament | null;
    @openModule.State qualifierScores!: QualifierScore[] | null;

    currentFilter: sortType = "zScore";
    sortDir: "asc" | "desc" = "desc";
    mapSort = -1;
    filters: sortType[] = filters;

    get mapNames (): {
        map: string;
        mapID: number;
    }[] {
        if (!this.qualifierScores)
            return [];

        const mapNames = this.qualifierScores
            .map(s => ({
                map: s.map,
                mapID: s.mapID,
            }))
            .filter((v, i, a) => a.findIndex(t => (t.map === v.map && t.mapID === v.mapID)) === i);

        mapNames.sort((a, b) => a.mapID - b.mapID);
        return mapNames;
    }

    get useAvg (): boolean {
        return this.currentFilter === "average" || this.currentFilter === "relAvg" || this.currentFilter === "percentAvg";
    }

    get shownQualifierScoreViews (): QualifierScoreView[] {
        return this.syncView === "players" ? this.playerQualifierScoreViews : this.teamQualifierScoreViews;
    }

    computeQualifierScoreViews (idNameAccessor: (score: QualifierScore) => { id: number, name: string }): QualifierScoreView[] {
        if (!this.qualifierScores)
            return [];

        const qualifierScoreViews: QualifierScoreView[] = [];
        const idNames = new Set(this.qualifierScores.map(idNameAccessor));

        const scoresByAccessorID = new Map<number, QualifierScore[]>();
        const scoresByMapID = new Map<number, number[]>();
        for (const score of this.qualifierScores) {
            const userID = idNameAccessor(score).id;
            const scores = scoresByAccessorID.get(userID) || [];
            scores.push(score);
            scoresByAccessorID.set(userID, scores);
        }

        // Create score objects for each player
        for (const idName of idNames) {
            const scores = scoresByAccessorID.get(idName.id)!;
            const nonZeroScores = scores.filter(score => score.score !== 0);
            if (nonZeroScores.length === 0)
                continue;

            const scoreView: QualifierScoreView = {
                ID: idName.id,
                name: idName.name,
                scores: this.mapNames.map(map => {
                    const mapScores = scores.filter(score => score.mapID === map.mapID);
                    const score = mapScores.reduce((a, b) => a + b.score, 0);
                    const avgScore = Math.round(score / (mapScores.length || 1));

                    const mapID = map.mapID;
                    const mapScoreHash = scoresByMapID.get(mapID) || [];
                    mapScoreHash.push(score);
                    scoresByMapID.set(mapID, mapScoreHash);

                    return {
                        map: map.map,
                        mapID: map.mapID,
                        sum: score,
                        average: avgScore,
                        relMax: -100,
                        percentMax: -100,
                        relAvg: -100,
                        percentAvg: -100,
                        zScore: -100,
                        isBest: false,
                    };
                }),
                best: "",
                worst: "",
                sum: scores.reduce((a, b) => a + b.score, 0),
                average: Math.round(nonZeroScores.reduce((a, b) => a + b.score, 0) / (nonZeroScores.length || 1)),
                relMax: -100,
                percentMax: -100,
                relAvg: -100,
                percentAvg: -100,
                zScore: -100,
                placement: -1,
            };
            scoreView.scores.sort((a, b) => a.mapID - b.mapID);

            if (this.syncView === "players") {
                const team = this.qualifierScores.find(s => s.userID === idName.id);
                if (team)
                    scoreView.team = team.teamName;
            }

            qualifierScoreViews.push(scoreView);
        }

        // Compute stats for each map
        const statsByMapID = new Map<number, {
            max: number;
            avg: number;
            stdDev: number;
        }>();
        for (const mapID of scoresByMapID.keys()) {
            const scores = scoresByMapID.get(mapID)!;
            const max = Math.max(...scores);
            const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
            const stdDev = Math.sqrt(scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / (scores.length || 1));
            statsByMapID.set(mapID, { max, avg, stdDev });
        }

        // Compute per-score stats and find best values
        const maxFilterByMapID = new Map<number, {
            sum: number;
            average: number;
            relMax: number;
            percentMax: number;
            relAvg: number;
            percentAvg: number;
            zScore: number;
        }>();
        qualifierScoreViews.forEach(score => {
            score.scores.forEach(s => {
                if (s.sum === 0)
                    return;

                const mapsStats = statsByMapID.get(s.mapID)!;
                const mapMax = maxFilterByMapID.get(s.mapID) || { sum: 0, average: 0, relMax: 0, percentMax: 0, relAvg: 0, percentAvg: 0, zScore: 0 };

                s.relMax = s.sum / (mapsStats.max || 1);
                s.percentMax = Math.round(s.relMax * 100);

                s.relAvg = s.sum / (mapsStats.avg || 1);
                s.percentAvg = Math.round(s.relAvg * 100);

                s.zScore = (s.sum - mapsStats.avg) / (mapsStats.stdDev || 1);
                
                mapMax.sum = Math.max(mapMax.sum, s.sum);
                mapMax.average = Math.max(mapMax.average, s.average);
                mapMax.relMax = Math.max(mapMax.relMax, s.relMax);
                mapMax.percentMax = Math.max(mapMax.percentMax, s.percentMax);
                mapMax.relAvg = Math.max(mapMax.relAvg, s.relAvg);
                mapMax.percentAvg = Math.max(mapMax.percentAvg, s.percentAvg);
                mapMax.zScore = Math.max(mapMax.zScore, s.zScore);
                maxFilterByMapID.set(s.mapID, mapMax);
            });

            const nonZeroScores = score.scores.filter(score => score.sum !== 0);
            score.relMax = nonZeroScores.reduce((a, b) => a + b.relMax, 0);
            score.percentMax = Math.round(nonZeroScores.reduce((a, b) => a + b.percentMax, 0) / (nonZeroScores.length || 1));
            score.relAvg = nonZeroScores.reduce((a, b) => a + b.relAvg, 0);
            score.percentAvg = Math.round(nonZeroScores.reduce((a, b) => a + b.percentAvg, 0) / (nonZeroScores.length || 1));
            score.zScore = nonZeroScores.reduce((a, b) => a + b.zScore, 0);    
        });

        // Add best/worst values, and placement
        qualifierScoreViews.forEach(score => {
            score.scores.forEach(s => {
                if (s[this.currentFilter] === maxFilterByMapID.get(s.mapID)?.[this.currentFilter])
                    s.isBest = true;
            });
            score.placement = qualifierScoreViews.filter(s => s.zScore > score.zScore).length + 1;
            score.best = score.scores.reduce((a, b) => a[this.currentFilter] > b[this.currentFilter] ? a : b).map,
            score.worst = score.scores.filter(score => score.sum !== 0).reduce((a, b) => a[this.currentFilter] < b[this.currentFilter] ? a : b).map;
        });

        // Sort by current filter
        qualifierScoreViews.sort((a, b) => {
            if (this.mapSort !== -1 && a.scores[this.mapSort])
                return this.sortDir === "asc" ? a.scores[this.mapSort][this.currentFilter] - b.scores[this.mapSort][this.currentFilter] : b.scores[this.mapSort][this.currentFilter] - a.scores[this.mapSort][this.currentFilter];

            return this.sortDir === "asc" ? a[this.currentFilter] - b[this.currentFilter] : b[this.currentFilter] - a[this.currentFilter];
        });

        return qualifierScoreViews;
    }

    get playerQualifierScoreViews (): QualifierScoreView[] {
        return this.computeQualifierScoreViews(score => ({ id: score.userID, name: score.username }));
    }

    get teamQualifierScoreViews (): QualifierScoreView[] {
        return this.computeQualifierScoreViews(score => ({ id: score.teamID, name: score.teamName }));
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
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            padding: 15px 5px;
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