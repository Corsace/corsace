<template>
    <div class="mappool_map_banner">
        <div>
            <!--- replace with slot-->
            <img 
                class="mappool_map_banner__img"
                src="https://i.ibb.co/4WJHt0C/Mask-group-1.png"
            >
        </div>
        <div class="mappool_map_banner__info">
            <!--- replace with slot-->
            <div class="mappool_map_banner__song_data">
                <div class="mappool_map_banner__title">
                    Song Title
                </div>
                <!--- replace with slot-->
                <div class="mappool_map_banner__artist">
                    Song Artist
                </div>
            </div>
            <hr class="line--red line--banner">
            <div class="mappool_map_banner__osu_data">
                <div class="mappool_map_banner__osu_data_text">
                    <div class="mappool_map_banner__osu_data_text--mapper">
                        MAPPER
                    </div>
                    <!--- replace with slot-->
                    Mapper Name
                </div>
                <div class="mappool_map_banner__osu_data_text">
                    <div class="mappool_map_banner__osu_data_text--difficulty">
                        DIFFICULTY
                    </div>
                    <!--- replace with slot-->
                    Diff Name
                </div>
            </div>
        </div>
        <MappoolMapStats />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import MappoolMapData from "./MappoolMapData.vue";
import MappoolMapStats from "./MappoolMapStats.vue";

@Component({
    components: {
        MappoolMapData,
        MappoolMapStats,
    },
})

export default class MappoolMapBanner extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.mappool_map_banner {
    font-family: $font-ggsans;
    margin: 5px 0px;
    display: flex;
    flex-direction: row;
    min-height: 100px;
    background: linear-gradient(0deg, #131313, #131313);

    &__img {
        display: block;
        min-height: 100%;
    }

    &__info {
        background: #171B1E;
        width: 100%;
        padding-left: 15px;
    }

    &__song_data {
        display: flex;
        flex-direction: column;
        padding: 5px 15px 0px 0px;
    }

    &__title {
        font-weight: 700;
        font-size: $font-lg;
    }

    &__artist {
        font-weight: 500;
        font-style: italic;
    }

    &__osu_data {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        padding: 4px 15px 5px 0px;
        min-width: 30%;

        &_text {
            display: flex;
            flex-direction: row;
            padding-right: 5vw;
            font-weight: 500;

            &--mapper {
                background-color: $open-red;
                font-family: $font-swis721;
                font-weight: 700;
                color: #131313;
                padding: 1.75px 3.5px 1.75px 3.5px;
                font-size: $font-sm;
                margin-right: 10px;
            }

            &--difficulty {
                background-color: $white;
                font-family: $font-swis721;
                font-weight: 700;
                color: #131313;
                padding: 1.75px 3.5px 1.75px 3.5px;
                font-size: $font-sm;
                margin-right: 10px;
            }
        }
    }
}

</style>