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
                        <th>TEAM</th>
                        <th>BEST</th>
                        <th>WORST</th>
                        <th>{{ $t(`open.qualifiers.scores.nav.${currentFilter}`) }}</th>
                        <th
                            v-for="map in mapNames"
                            :key="map.mapID"
                        >
                            {{ map.map }}
                        </th>
                    </tr>
                    <tr
                        v-for="row in shownQualifierScoreViews"
                        :key="row.ID"
                    >
                        <td>{{ row.name }}</td>
                        <td>{{ row.best }}</td>
                        <td>{{ row.worst }}</td>
                        <td>{{ row[currentFilter] === -100 ? "" : row[currentFilter].toFixed(currentFilter === "sum" || currentFilter === "average" ? 0 : 2) }}</td>
                        <td 
                            v-for="score in row.scores"
                            :key="score.map"
                            :class="{ 'scores__table--highlight': score.isBest }"
                        >
                            {{ currentFilter === "sum" || currentFilter === "average" ? score.score || "" : score[currentFilter] === -100 ? "" : score[currentFilter].toFixed(2) }}{{ currentFilter.includes("percent") && score[currentFilter] !== -100 ? "%" : "" }}
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
    filters: sortType[] = filters;

    get mapNames (): {
        map: string;
        mapID: number;
    }[] {
        if (!this.qualifierScores)
            return [];

        const mapNames = this.qualifierScores.map(s => ({
            map: s.map,
            mapID: s.mapID,
        })).filter((v, i, a) => a.findIndex(t => (t.map === v.map && t.mapID === v.mapID)) === i);
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
        const idNames = this.qualifierScores.map(idNameAccessor).filter((v, i, a) => a.findIndex(t => (t.id === v.id && t.name === v.name)) === i);

        for (const idName of idNames) {
            const scores = this.qualifierScores.filter(s => idNameAccessor(s).id === idName.id);
            const scoreView: QualifierScoreView = {
                ID: idName.id,
                name: idName.name,
                scores: this.mapNames.map(map => {
                    const mapScores = scores.filter(s => s.mapID === map.mapID);
                    const score = mapScores.reduce((a, b) => a + b.score, 0);
                    const avgScore = Math.round(mapScores.reduce((a, b) => a + b.score, 0) / (mapScores.length || 1));
                    return {
                        map: map.map,
                        mapID: map.mapID,
                        score: this.useAvg ? avgScore : score,
                        relMax: -100,
                        percentMax: -100,
                        relAvg: -100,
                        percentAvg: -100,
                        zScore: -100,
                        isBest: false,
                    };
                }),
                best: scores.reduce((a, b) => a.score > b.score ? a : b).map,
                worst: scores.filter(score => score.score !== 0).reduce((a, b) => a.score < b.score ? a : b).map,
                sum: scores.reduce((a, b) => a + b.score, 0),
                average: Math.round(scores.filter(score => score.score !== 0).reduce((a, b) => a + b.score, 0) / (scores.filter(score => score.score !== 0).length || 1)),
                relMax: -100,
                percentMax: -100,
                relAvg: -100,
                percentAvg: -100,
                zScore: -100,
            };
            scoreView.scores.sort((a, b) => a.mapID - b.mapID);

            qualifierScoreViews.push(scoreView);
        }

        qualifierScoreViews.forEach(score => {
            score.scores.forEach(s => {
                if (s.score === 0)
                    return;

                const mapsScores = qualifierScoreViews.flatMap(v => v.scores.filter(t => t.mapID === s.mapID));
                const max = Math.max(...mapsScores.map(score => score.score));
                const avg = mapsScores.reduce((a, b) => a + b.score, 0) / (mapsScores.length || 1);
                const stddev = Math.sqrt(mapsScores.reduce((a, b) => a + Math.pow(b.score - avg, 2), 0) / (mapsScores.length || 1));

                if (s.score === max)
                    s.isBest = true;

                s.relMax = s.score / (max || 1);
                s.percentMax = Math.round(s.relMax * 100);

                s.relAvg = s.score / (avg || 1);
                s.percentAvg = Math.round(s.relAvg * 100);

                s.zScore = (s.score - avg) / (stddev || 1);
            });
            score.relMax = score.scores.filter(score => score.score !== 0).reduce((a, b) => a + b.relMax, 0);
            score.percentMax = Math.round(score.scores.filter(score => score.score !== 0).reduce((a, b) => a + b.percentMax, 0) / (score.scores.filter(score => score.score !== 0).length || 1));
            score.relAvg = score.scores.filter(score => score.score !== 0).reduce((a, b) => a + b.relAvg, 0);
            score.percentAvg = Math.round(score.scores.filter(score => score.score !== 0).reduce((a, b) => a + b.percentAvg, 0) / (score.scores.filter(score => score.score !== 0).length || 1));
            score.zScore = score.scores.filter(score => score.score !== 0).reduce((a, b) => a + b.zScore, 0);    
        });

        qualifierScoreViews.sort((a, b) => b[this.currentFilter] - a[this.currentFilter]);

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
        const teamIDs = this.qualifierScores.map(s => s.teamID).filter((v, i, a) => a.indexOf(v) === i);

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
    }

    &__table th {
        font-size: $font-sm;
        font-weight: 700;
        border-bottom: 1px solid #383838;
        padding: 15px 5px;
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