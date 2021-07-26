<template>
    <div>
        <a v-if="map" :href="osuLink()" :target="newTab()" :onclick="onClick()">
            <div class="map" :style="mapStyle()">
                <div class="mapLeft">
                    <div class="mapArtist">{{ map.artist }}</div>
                    <div class="mapTitle">{{ map.title }}</div>
                </div>
                <div class="inputWrapper" v-if="loggedInUser.openStaff.mappooler && edit">
                    <input v-model="mapURL" class="mapUrl" spellcheck="false" @input="changeMap">
                </div>
                <div class="mapRight">
                    <div class="diffWrapper">
                        <div class="mapDiff">[{{ map.difficulty }}</div>
                        <div class="mapDiff" :style="{overflow: 'unset'}">]</div>
                    </div>
                    <div class="mapSpecs">
                        <div class="mapTime">
                            <img src="../../../Assets/img/open/time.png"> {{ map.time }}
                        </div>
                        <div class="mapBPM">
                            <img src="../../../Assets/img/open/bpm.png"> {{ Math.round(map.bpm) }}
                        </div>
                        <div class="mapStars">
                            <img src="../../../Assets/img/open/star.png"> {{ map.stars.toFixed(2) }}
                        </div>
                    </div>
                </div>
            </div>
        </a>
        <div v-else class="map">
            <div class="mapLeft">
                <div class="mapArtist">Artist</div>
                <div class="mapTitle">Title</div>
            </div>
            <div class="inputWrapper" v-if="loggedInUser.openStaff.mappooler && edit">
                <input v-model="mapNewURL" class="mapUrl" placeholder="paste url here (no /s/ links)" spellcheck="false" @input="addMap">
            </div>
            <div class="mapRight">
                <div class="mapDiff">[Difficulty]</div>
                <div class="mapSpecs">
                    <div class="mapTime">
                        <img src="../../../Assets/img/open/time.png"> -:--
                    </div>
                    <div class="mapBPM">
                        <img src="../../../Assets/img/open/bpm.png"> ---
                    </div>
                    <div class="mapStars">
                        <img src="../../../Assets/img/open/star.png"> -.--
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from "vue-property-decorator"
import { State } from "vuex-class"
import { MappoolMap } from "../../../Interfaces/mappool";
import { UserOpenInfo } from "../../../Interfaces/user";
import axios from "axios"
@Component
export default class MapComponent extends Vue {

    @State loggedInUser!: UserOpenInfo

    @Prop({ type: Object }) readonly map!: MappoolMap
    @Prop({ type: String }) readonly round!: string;
    @Prop({ type: Boolean }) readonly edit!: boolean;
    @Prop({ type: String }) readonly mod!: string;


    mapURL = ""
    mapNewURL = ""
    regex = /^https:\/\/osu\.ppy\.sh\/(b|beatmapsets|beatmaps)\/(\d+)(#osu\/(\d+))?/

    created() {
        if(this.map) {
            this.mapURL = `https://osu.ppy.sh/b/${this.map.mapID}`;
        }
    }

    beforeUpdate() {
        if(this.map) {
            this.mapURL = `https://osu.ppy.sh/b/${this.map.mapID}`;
        } else {
            this.mapURL = "";
        }
    }
    mapStyle() {
        const url = `'https://assets.ppy.sh/beatmaps/${this.map.setID}/covers/cover.jpg'`;
        return {
            background: 'linear-gradient(rgba(0, 0, 0, 0.60), rgba(0, 0, 0, 0.60)), url(' + url + ')',
            'background-position': 'bottom',
            'background-size': 'cover',
        }
    }
    
    osuLink() {
        const url = `https://osu.ppy.sh/b/${this.map.mapID}`;
        if(!this.edit) {
            return url;
        } else {
            return "#";
        }
    }

    newTab() {
        if(this.osuLink() === "#") {
            return;
        } else {
            return "_blank";
        }
    }

    onClick() {
        if(this.osuLink() === "#") {
            return "return false;";
        } else {
            return;
        }
    }
    //todo: test these
    async addMap () {
        const result = this.regex.exec(this.mapNewURL);
        if(result) {
            let id = "0";
            if (result[1] === "b" || result[1] === "beatmaps")
                id = result[2];
            else if (result[1] === "beatmapsets")
                id = result[4]
            await axios.post("/api/mappool/add?map=" + id + "&round=" + this.round.replace(/ /g, "%20") + "&mod=" + this.mod);
            this.mapURL = `https://osu.ppy.sh/b/${id}`;
            this.$emit("refresh");
        } else {
            alert("Map does not exist/your link is bad!");
            this.mapNewURL = "";
        }
    }

    async changeMap () {
        if(this.mapURL.length === 0) {
            await axios.delete("/api/mappool/delete?map=" + this.map.mapID + "&round=" + this.round.replace(/ /g, "%20") + "&mod=" + this.mod);
            this.mapNewURL = "";
            this.$emit("refresh");
        } else {
            const result = this.regex.exec(this.mapURL);
            if(result) {
                let id = "0";
                if (result[1] === "b" || result[1] === "beatmaps")
                    id = result[2];
                else if (result[1] === "beatmapsets")
                    id = result[4]
                await axios.patch("/api/mappool/replace?oldMap=" + this.map.mapID + "&map=" + id + "&round=" + this.round.replace(/ /g, "%20") + "&mod=" + this.mod);
                this.mapURL = `https://osu.ppy.sh/b/${id}`;
                this.$emit("refresh");
            } else {
                alert("Map does not exist/your link is bad!");
                this.mapURL = `https://osu.ppy.sh/b/${this.map.mapID}`;
            }
        }
    }
}
</script>

<style>
</style>