<template>
    <div>
        <div :class="modClass" @click="isActive = !isActive">
            &#9660; {{ modName }}
        </div>
        <div class="maps">
            <div class="mapWrapper" v-for="index in count" :key="index">
                <transition name="map-show">
                    <MapComponent v-if="isActive" :map="modGroup.beatmaps[index-1]" :user="user" :round="round" :mod="modGroup.mod" :edit="edit" @refresh="refresh"></MapComponent>
                </transition>
            </div>
        </div>
    </div>
</template>

<script>
import axios from "axios";
import regeneratorRuntime from "regenerator-runtime";
import MapComponent from "./MapComponent";

export default {
    components: {
        MapComponent,
    },
    data: () => ({
        count: 0,
        modClass: '',
        modName: '',
        isActive: false,
    }),
    props: {
        user: Object,
        modGroup: Object,
        round: String,
        edit: Boolean,
    },
    created: function() {
        this.modClass = `mod ${this.modGroup.mod}`;
        switch(this.modGroup.mod) {
            case 'NM':
                this.modName = "NOMOD";
                break;
            case 'HD':
                this.modName = "HIDDEN";
                break;
            case 'HR':
                this.modName = "HARD ROCK";
                break;
            case 'DT':
                this.modName = "DOUBLE TIME";
                break;
            case 'FM':
                this.modName = "FREEMOD";
                break;
            case 'TB':
                this.modName = "TIEBREAKER";
                break;
        }
        if (this.round === "QUALIFIERS") {
            if(this.modGroup.mod === "TB" || this.modGroup.mod === "FM") {
                this.count = 0;
            } else if(this.modGroup.mod === "NM") {
                this.count = 4;
            } else {
                this.count = 2;
            }
        } else {
            if(this.modGroup.mod === "TB") {
                this.count = 1;
            } else if(this.modGroup.mod === "NM") {
                this.count = 6;
            } else if(this.modGroup.mod === "DT") {
                this.count = 4
            } else {
                this.count = 3;
            }
        }
    },
    methods: {
        refresh: function() {
            this.$emit("refresh");
        }
    }
}
</script>

<style>
.mod {
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 12px;
    background-image: linear-gradient(to bottom, #181818, #202020 51%);
}

.NM {
    color: #ffffff;
    text-shadow: 0 0 10px rgba(255,255,255,.75);
}

.HR {
    color: #e9b0b0;
    text-shadow: 0 0 10px rgba(233,176,176,.75);
}

.HD {
    color: #e9d4b0;
    text-shadow: 0 0 10px rgba(233,212,176,.75);
}

.DT {
    color: #d2b0e9;
    text-shadow: 0 0 10px rgba(210,176,233,.75);
}

.FM {
    color: #b0cfe9;
    text-shadow: 0 0 10px rgba(176,207,233,.75);
}

.TB {
    color: #b0e9c3;
    text-shadow: 0 0 10px rgba(176,233,195,.75);
}

.map, .mapNoBG {
    position: relative;
    display: grid;
    align-items: center;
    justify-items: center;
    height: 3em;
    padding: 17px;
    background-color: #2b2b2b;
    grid-template-columns: repeat(2, 1fr);
}

.mapLeft, .mapRight {
    max-width: 100%;
    overflow: hidden;
    min-width: 100%;
}

.mapLeft {
    grid-column: 1/2;
}

.inputWrapper {
    position: absolute;
    top: 0;
    background: black;
    width: 8.5em;
}

.mapUrl, .mapUrl::placeholder {
    width: 100%;
    background: none;
    border: 0;
    font: inherit;
    font-size: 14px;
    font-style: italic;
    color: #ffffff;
    text-align: center;
}

.mapUrl:focus {
    outline: 0;
}

.mapRight {
    grid-column: 2/3;
    display: grid;
}

.mapArtist, .mapTitle {
    line-height: normal;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
}

.mapArtist {
    font-size: 18px;
}

.mapTitle, .mapDiff {
    font-weight: bold;
}

.diffWrapper {
    white-space: nowrap;
    display: flex;
    justify-content: flex-end;
    overflow: hidden;
}

.mapDiff {
    line-height: normal;
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mapSpecs {
    display: grid;
    grid-auto-flow: column;
    font-size: 20px;
    align-items: center;
    justify-content: end;
    grid-column-gap: 20px;
}

.mapTime, .mapBPM, .mapStars {
    display: grid;
    grid-auto-flow: column;
    grid-column-gap: 4px;
    align-items: center;
}

.map-show-enter-active {
    max-height: 100%;
    transition: 0.3s cubic-bezier(0,0,.25,1);
}

.map-show-leave-active {
    transition: 0.3s cubic-bezier(0,0,.25,1);
}

.map-show-enter, .map-show-leave-to {
    opacity: 0;
    max-height: 0px;
    overflow: hidden;
}

.map-show-leave, .map-show-enter-to {
    opacity: 100;
    overflow: hidden;
}

</style>
