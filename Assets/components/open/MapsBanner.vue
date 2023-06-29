<template>
    <div class="maps-banner">
        <div class="banner-img">
            <!--- replace with slot-->
            <img src="https://i.ibb.co/4WJHt0C/Mask-group-1.png">
        </div>
        <div class="banner-info">
            <!--- replace with slot-->
            <div class="song-data">
                <div class="map-title">
                    Song Title
                </div>
                <!--- replace with slot-->
                <div class="map-artist">
                    Song Artist
                </div>
            </div>
            <hr class="red-banner">
            <div class="osu-data">
                <div class="osu-data-text">
                    <div class="mapper-decorator">
                        MAPPER
                    </div>
                    <!--- replace with slot-->
                    Mapper Name
                </div>
                <div class="osu-data-text">
                    <div class="diff-decorator">
                        DIFFICULTY
                    </div>
                    <!--- replace with slot-->
                    Diff Name
                </div>
            </div>
        </div>
        <div class="banner-stats">
            <MapsData />
            <MapsData />
            <MapsData />
            <MapsData />
            <MapsData />
            <MapsData />
            <MapsData />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import MapsData from "./MapsData.vue";

@Component({
    components: {
        MapsData,
    },
})

export default class MapsBanner extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.maps-banner {
    display: flex;
    flex-direction: row;
    min-height: 100px;
}

.banner-info {
    background: #171B1E;
    width: 100%;
    padding-left: 15px;
}

img {
    display: block;
}

hr.red-banner {
    border: 1px solid $open-red;
}

.song-data {
    display: flex;
    flex-direction: column;
    padding: 5px 15px 0px 0px;
}

.map-title {
    font-weight: 700;
    font-size: $font-lg;
}

.map-artist {
    font-weight: 500;
    font-family: gg sans;
    font-style: italic;

}

.osu-data {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 3px 15px 5px 0px;
    width: 50%;
}

.osu-data-text {
    display: flex;
    flex-direction: row;
}

.mapper-decorator {
    background-color: $open-red;
    font-family: $font-swis721;
    font-weight: 700;
    color: #131313;
    padding: 1.75px 3.5px 1.75px 3.5px;
    font-size: $font-sm;
    margin-right: 10px;
}

.diff-decorator {
    background-color: #EBEBEB;
    font-family: $font-swis721;
    font-weight: 700;
    color: #131313;
    padding: 1.75px 3.5px 1.75px 3.5px;
    font-size: $font-sm;
    margin-right: 10px;
}

</style>