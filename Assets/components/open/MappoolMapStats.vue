<template>
    <div class="mappool_map_stats">
        <!--- replace all numbers with slot-->
        <table class="mappool_map_stats-table">
            <tbody>
                <tr class="mappool_map_stats-table__row">
                    <td>
                        <img
                            src="../../img/site/open/LEN.svg"
                            class="mappool_map_stats-table__img"
                        >
                        LEN
                    </td>
                    <td>
                        <img
                            src="../../img/site/open/CS.svg"
                            class="mappool_map_stats-table__img"
                        >
                        CS
                    </td>
                    <td>
                        <img
                            src="../../img/site/open/HP.svg"
                            class="mappool_map_stats-table__img"
                        >
                        HP
                    </td>
                </tr>
                <tr class="mappool_map_stats-table__row">
                    <td>
                        <img
                            src="../../img/site/open/BPM.svg"
                            class="mappool_map_stats-table__img"
                        >
                        BPM
                    </td>
                    <td>
                        <img
                            src="../../img/site/open/AR.svg"
                            class="mappool_map_stats-table__img"
                        >
                        AR
                    </td>
                    <td>&nbsp;</td>
                </tr>
                <tr class="mappool_map_stats-table__row">
                    <td>
                        <img
                            src="../../img/site/open/FAVS.svg"
                            class="mappool_map_stats-table__img"
                        >
                        FAV
                    </td>
                    <td>
                        <img
                            src="../../img/site/open/OD.svg"
                            class="mappool_map_stats-table__img"
                        >
                        OD
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class MappoolMapStats extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.mappool_map_stats {
    background-image: url('../../img/site/open/checkers-bg.png');
    mix-blend-mode: Difference;
    background-repeat: no-repeat;
    background-position: bottom 0px right 0px;
    min-width: 30%;
}

.mappool_map_stats-table {
        width: 100%;
        height: 100%;
        padding: 5px 5px;

        &__row {
            font-weight: 500;
            text-align: center;
        }

        &__img {
            vertical-align: -10%;
        }
}
</style>