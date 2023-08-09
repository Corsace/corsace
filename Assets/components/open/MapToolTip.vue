<template>
    <div class="map_tooltip">
        <div class="map_tooltip__top_left" />
        <div
            class="map_tooltip__banner"
        />
        <!-- :style="`background-image: url(https://assets.ppy.sh/beatmaps/${mapSync.beatmap?.beatmapset?.ID || ''}/covers/cover.jpg)`" -->
        <div class="map_tooltip_info">
            <div class="map_tooltip_info__wrapper">
                <div class="map_tooltip_info__wrapper__title" />
                <div class="map_tooltip_info__wrapper__artist" />
            </div>
            <div class="map_tooltip_info__bottom" />
        </div>
        <div class="map_tooltip__top_right" />
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import { Mappool } from "../../../Interfaces/mappool";

@Component({
    components: {
    },
})


export default class MapToolTip extends Vue {
    @PropSync("pool", { type: Object }) poolData!: Mappool;

    get filteredMap () {
        if (!this.mapSearchID)
            return this.teamList;
        return this.teamList?.filter(team => 
            team.ID.toString() == this.searchID.toLowerCase()
        );
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.map_tooltip {
    display: flex;
    flex-direction: column;
    position: fixed;
    z-index: 10;

    background: linear-gradient(0deg, #131313, #131313),
    linear-gradient(0deg, #353535, #353535);
    background: #131313;

    border: 1px solid #353535;

    width: 226px;
    min-height: 75px;
    padding-bottom: 10px;

    background-image: url("../../img/site/open/checkers-bg.png");
    background-repeat: no-repeat;
    background-size: cover;
    background-position: bottom;

    align-items: center;

    overflow: hidden;

    pointer-events: all;

    &__top_left {
        display: flex;
        position: absolute;
        top: 2px;
        left: 2px;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 8px 8px 0 0;
        border-color: $open-red transparent transparent transparent;

        z-index: 1;
    }
    &__top_right {
        display: flex;
        position: absolute;
        top: 2px;
        right: 2px;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 0 8px 8px 0;
        border-color: transparent #353535 transparent transparent;;
        z-index: 1;
    }

    &__banner {
        display: flex;
        width: 95%;
        height: 31px;
        margin-top: 4px;
        z-index: 0;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        clip-path: polygon(0 8.00px, 8.00px 0,100% 0,100% 100%,0 100%);
    }

    &__list {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 80%;
        margin-top: 10px;
        align-items: center;
        padding-left: 10px;
        gap: 5px;

        &__item {
            display: flex;
            flex-direction: row;
            width: 75%;
            gap: 5px;

            &--leader {
                position: relative;
                &:after {
                    content: "";
                    background-image: url('../../img/site/open/team/manager.svg');
                    background-size: 100%;
                    background-repeat: no-repeat;
                    width: 8.4px;
                    height: 5.5px;
                    position: absolute;
                    left: -12px;
                    top: 4px;
                }
            }

            &--text {
                font-family: $font-ggsans;
                list-style: none;
                font-size: 10px;
                font-weight: 400;
                line-height: 13px;
                letter-spacing: 0em;
                text-align: left;

                &--bws {
                    color: $open-red;
                    font-family: $font-swis721;
                    font-size: 7px;
                    font-weight: 700;
                    line-height: 8px;
                    letter-spacing: 0em;
                    text-align: right;
                    align-self: center;
                }
            }
        }
    }
}
</style>