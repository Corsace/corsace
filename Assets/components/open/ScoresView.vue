<template>
    <div class="scores">
        <div class="scores__sub_header">
            <div class="scores__sub_header_subtext">
                {{ $t('open.qualifiers.scores.nav.filters') }}
            </div>
            <div class="scores__sub_header_item scores__sub_header_item--active">
                {{ $t('open.qualifiers.scores.nav.average') }}
            </div>
            <!-- <div class="scores__sub_header_item">
                {{ $t('open.qualifiers.scores.nav.sum') }}
            </div>
            <div class="scores__sub_header_item">
                {{ $t('open.qualifiers.scores.nav.%avg') }}
            </div>
            <div class="scores__sub_header_item">
                {{ $t('open.qualifiers.scores.nav.seedings') }}
            </div> -->
        </div>
        <hr class="line--red line--bottom-space">
        <div class="scores__wrapper">
            <table class="scores__table">
                <tbody>
                    <tr>
                        <th>TEAM</th>
                        <th>BEST</th>
                        <th>WORST</th>
                        <th>AVG.</th>
                        <th
                            v-for="map in mapNames"
                            :key="map"
                        >
                            {{ map }}
                        </th>
                    </tr>
                    <tr
                        v-for="row in shownQualifierScoreViews"
                        :key="row.ID"
                    >
                        <td>{{ row.name }}</td>
                        <td>{{ row.best }}</td>
                        <td>{{ row.worst }}</td>
                        <td>{{ row.average }}</td>
                        <td 
                            v-for="score in row.scores"
                            :key="score.map"
                            :class="{ 'scores__table--highlight': score.isBest }"
                        >
                            {{ score.score === 0 ? "" : score.score }}
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

@Component
export default class ScoresView extends Vue {

    @PropSync("view", { type: String }) syncView!: "players" | "teams";

    @openModule.State tournament!: Tournament | null;
    @openModule.State qualifierScores!: QualifierScore[] | null;

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

    get shownQualifierScoreViews (): QualifierScoreView[] {
        return this.syncView === "players" ? this.playerQualifierScoreViews : this.teamQualifierScoreViews;
    }

    get playerQualifierScoreViews (): QualifierScoreView[] {
        if (!this.qualifierScores)
            return [];

        const qualifierScoreViews: QualifierScoreView[] = [];
        const playerIDs = this.qualifierScores.map(s => s.userID).filter((v, i, a) => a.indexOf(v) === i);

        for (const playerID of playerIDs) {
            const playerScores = this.qualifierScores.filter(s => s.userID === playerID);
            const playerScoreView: QualifierScoreView = {
                ID: playerID,
                name: playerScores[0].username,
                scores: this.mapNames.map(map => {
                    const mapScores = playerScores.filter(s => s.mapID === map.mapID);
                    return {
                        map: map.map,
                        mapID: map.mapID,
                        score: Math.round(mapScores.reduce((a, b) => a + b.score, 0) / (mapScores.length || 1)),
                        isBest: false,
                    };
                }),
                best: playerScores.reduce((a, b) => a.score > b.score ? a : b).map,
                worst: playerScores.reduce((a, b) => a.score < b.score ? a : b).map,
                average: Math.round(playerScores.reduce((a, b) => a + b.score, 0) / (playerScores.length || 1)),
            };
            playerScoreView.scores.sort((a, b) => a.mapID - b.mapID);

            qualifierScoreViews.push(playerScoreView);
        }

        qualifierScoreViews.forEach(score => {
            score.scores.forEach(s => {
                if (s.score === Math.max(...qualifierScoreViews.map(v => v.scores.find(t => t.mapID === s.mapID)?.score || 0)))
                    s.isBest = true;
            });
        });

        qualifierScoreViews.sort((a, b) => b.average - a.average);

        return qualifierScoreViews;
    }

    get teamQualifierScoreViews (): QualifierScoreView[] {
        if (!this.qualifierScores)
            return [];

        const qualifierScoreViews: QualifierScoreView[] = [];
        const teamIDs = this.qualifierScores.map(s => s.teamID).filter((v, i, a) => a.indexOf(v) === i);

        for (const teamID of teamIDs) {
            const teamScores = this.qualifierScores.filter(s => s.teamID === teamID);
            const teamScoreView: QualifierScoreView = {
                ID: teamID,
                name: teamScores[0].teamName,
                scores: this.mapNames.map(map => {
                    const mapScores = teamScores.filter(s => s.mapID === map.mapID);
                    return {
                        map: map.map,
                        mapID: map.mapID,
                        score: Math.round(mapScores.reduce((a, b) => a + b.score, 0) / (mapScores.length || 1)),
                        isBest: false,
                    };
                }),
                best: teamScores.reduce((a, b) => a.score > b.score ? a : b).map,
                worst: teamScores.reduce((a, b) => a.score < b.score ? a : b).map,
                average: Math.round(teamScores.reduce((a, b) => a + b.score, 0) / (teamScores.length || 1)),
            };
            teamScoreView.scores.sort((a, b) => a.mapID - b.mapID);

            qualifierScoreViews.push(teamScoreView);
        }

        qualifierScoreViews.forEach(score => {
            score.scores.forEach(s => {
                if (s.score === Math.max(...qualifierScoreViews.map(v => v.scores.find(t => t.mapID === s.mapID)?.score || 0)))
                    s.isBest = true;
            });
        });

        qualifierScoreViews.sort((a, b) => b.average - a.average);

        return qualifierScoreViews;
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