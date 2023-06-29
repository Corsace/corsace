<template>
    <div class="qualifiers">
        <QualifiersSubheader />
        <div class="main-content">
            <div class="title-line">
                <div class="subtitle">
                    QUALIFIERS
                </div>
                <div class="button-group">
                    <div class="qualifier-button">
                        <div class="qualifier-button-text">
                            SHEETS
                        </div>
                        <div class="qualifier-button-ico">
                            <img src="../../Assets/img/site/open/sheets-ico.svg">
                        </div>
                    </div>
                    <div class="qualifier-button">
                        <div class="qualifier-button-text">
                            MAPPOOL
                        </div>
                        <div class="qualifier-button-ico">
                            <img src="../../Assets/img/site/open/dl-ico.svg">
                        </div>
                    </div>
                </div>
            </div>
            <hr class="red-bottom-space">
            <hr class="red-bottom-space">
            <div class="mappool-content">
                <MapsDropdown>
                    NOMOD
                </MapsDropdown>
                <MapsDropdown>
                    HIDDEN
                </MapsDropdown>
                <MapsDropdown>
                    DOUBLETIME
                </MapsDropdown>
                <MapsDropdown>
                    HARDROCK
                </MapsDropdown>
                <MapsDropdown>
                    FREEMOD
                </MapsDropdown>
                <MapsDropdown>
                    TIEBREAKER
                </MapsDropdown>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

import OpenButton from "../../Assets/components/open/OpenButton.vue";
import QualifiersSubheader from "../../Assets/components/open/QualifiersSubheader.vue";
import MapsDropdown from "../../Assets/components/open/MapsDropdown.vue";
import MapsBanner from "../../Assets/components/open/MapsBanner.vue";

@Component({
    components: {
        OpenButton,
        QualifiersSubheader,
        MapsDropdown,
        MapsBanner,
    },
    head () {
        return {
            title: "Corsace Open",
        };
    },
})
export default class Qualifiers extends Vue {

    async mounted () {
        await this.$store.dispatch("setInitialData", "open");
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.qualifiers {
    background: linear-gradient(180deg, #1F1F1F 0%, #131313 100%);
}

.main-content {
    align-self: center;
    width: 65vw;
    height: 100%;
    padding: 35px;
    background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
}

.title-line {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.button-group {
    display: flex;
    flex-direction: row;
}

.subtitle {
    font-size: $font-title;
    font-weight: bold;
}

.qualifier-button {
    display: flex;
    justify-content: space-between;
    flex-direction: row-reverse;
    background-color: $open-red;
    margin: 15px 0px 15px 20px;
    min-width: 150px;
    height: 30px;
    padding: 5px;
}

.qualifier-button-text {
    color: $open-dark;
    font-weight: bold;
}

.qualifier-button-ico img {
    vertical-align: -10%;
}

hr.red-bottom-space {
    border: 1px solid $open-red;
    box-shadow: 0px 4px 4px 0px #00000040;
    margin: 0 0 4.5px 0;
}

.mappool-content {
    padding-top: 20px;
}
</style>