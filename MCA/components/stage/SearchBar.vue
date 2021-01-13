<template>
    <div class="search">
        <div class="search__pre">
            <img 
                class="search__pre-image"
                src="../../../Assets/img/ayim-mca/site/magnifying glass.png"
            >
        </div>
        <input
            class="search__input"
            placeholder="search for a beatmap / user"
            maxlength="50"
            @input="updateText($event)"
        >

        <toggle-button
            :options="sectionOptions"
            @change="changeOption"
        />
        
        <toggle-button
            :options="orderOptions"
            @change="changeOrder"
        />
    </div>    
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";
import _ from "lodash";

import ToggleButton from "../ToggleButton.vue";

import { StageQuery } from "../../store/stage";

const stageModule = namespace("stage");

@Component({
    components: {
        ToggleButton,
    },
})
export default class SearchBar extends Vue {

    @stageModule.State section!: string;
    @stageModule.State query!: StageQuery;
    @stageModule.Action updateQuery;

    beatmapOptions = ["DATE", "ARTIST", "TITLE", "FAVS", "CREATOR", "SR"];
    userOptions = ["ID", "ALPH"];
    orderOptions = ["ASC", "DESC"];

    get sectionOptions () {
        if (this.section === "beatmaps") return this.beatmapOptions;
        return this.userOptions;
    }

    changeOption (option: string) {
        this.debounce({ option });
    }

    changeOrder (order: string) {
        this.debounce({ order });
    }

    updateText (e) {
        this.debounce({ text: e.target.value });
    }
    
    // Vue doesnt allow using debounce inside methods, so no idea how this stuff below works, but works Ok
    mounted () {
        this.emitUpdate = _.debounce(this.emitUpdate, 500);
    }

    debounce (event){
        this.emitUpdate(event);
    }

    emitUpdate (query: Partial<StageQuery>) {
        this.updateQuery(query);
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.search {
    display: flex;
    justify-content: space-between;

    & > * {
        padding: 5px;
        margin: 5px;
    }
}

.search__pre, .search__input {
    color: white;
    background-color: black;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.63);
}

.search__pre {
    width: 20%;
    border-radius: 5.5px 0 0 5.5px;
    margin-right: 0px;

    display: flex;
    align-items: center;
    justify-content: center;

    &-image {
        width: 35px;
    }

    &::before {
        width: 1px;
        height: 75%;
        background-color: white;
    }
}

.search__input {
    font-family: $font-body;
    font-size: $font-lg;

    border: 0;
    border-radius: 0 5.5px 5.5px 0;

    width: 100%;
    margin-left: 0px;

    &:focus {
        outline: none;
    }

    &::placeholder, &:placeholder-shown {
        color: rgba(255, 255, 255, 0.26);
        font-style: italic;
    }
}
</style>
