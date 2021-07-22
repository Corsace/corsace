<template>
    <search-bar
        class="category-filters"
        :placeholder="$t('mca.nom_vote.search')"
        @update:search="updateText($event)"
    >
        <button
            v-if="section === 'beatmaps' && loggedInUser"
            class="button"
            :class="{ 
                'button--friends': favourites,
                'button--small': $route.params.stage === 'voting' && section === 'beatmaps'
            }"
            @click="updateFavourite"
        >
            <img src="../../../Assets/img/ayim-mca/site/heart.png">
        </button>

        <toggle-button
            v-if="section === 'beatmaps' && loggedInUser"
            :class="{ 'button--small': $route.params.stage === 'voting' && section === 'beatmaps' }"
            :options="playedFilters"
            @change="changePlayed"
        />

        <toggle-button
            v-if="!results"
            :class="{ 'button--small': $route.params.stage === 'voting' && section === 'beatmaps' }"
            :options="sectionOptions"
            :arrow="orderOption"
            @change="changeOption"
        />
        
        <toggle-button
            v-if="!results"
            :class="{ 'button--small': $route.params.stage === 'voting' && section === 'beatmaps' }"
            :options="orderOptions"
            :arrow="orderOption"
            @change="changeOrder"
        />
        
        <button
            v-if="$route.params.stage === 'voting'"
            class="button"
            :class="{ 
                'button--active': showVoteChoiceBox,
                'button--small': section === 'beatmaps'
            }"
            @click="toggleVoteChoiceBox"
        >
            {{ $t(`mca.nom_vote.options.voteOrder`) }}
        </button>
    </search-bar>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { namespace, State } from "vuex-class";
import _ from "lodash";

import ToggleButton from "../../../MCA-AYIM/components/ToggleButton.vue";
import SearchBar from "../../../MCA-AYIM/components/SearchBar.vue";

import { StageQuery } from "../../../Interfaces/queries";
import { UserMCAInfo } from "../../../Interfaces/user";

const stageModule = namespace("stage");

@Component({
    components: {
        ToggleButton,
        SearchBar,
    },
})
export default class StagePageFilters extends Vue {

    @stageModule.State section!: string;

    @stageModule.State query!: StageQuery;

    @stageModule.State favourites!: boolean;
    @stageModule.State played!: boolean;

    @stageModule.State showVoteChoiceBox!: boolean;

    @stageModule.Action updateQuery;
    @stageModule.Action updateFavourites;
    @stageModule.Action updatePlayed;

    @stageModule.Mutation toggleVoteChoiceBox;

    @State loggedInUser!: UserMCAInfo | null;

    @Prop({ type: Boolean, default: false }) results!: boolean;

    beatmapOptions = ["date", "artist", "title", "favs", "creator", "sr"];
    userOptions = ["alph", "id"];
    playedFilters = ["all", "played"]
    orderOptions = ["asc", "desc"];
    votingOptions = ["incVote", "voteChoice"];
    orderOption = "asc";

    get sectionOptions () {
        if (this.section === "beatmaps") return this.beatmapOptions;
        return this.userOptions;
    }

    updateText (text: string) {
        this.updateQuery({ text });
    }

    updateFavourite () {
        this.updateFavourites(!this.favourites);
    }

    changePlayed () {
        this.updatePlayed(!this.played);
    }

    changeOption (option: string) {
        this.debounce({ option });
    }

    changeOrder (order: string) {
        this.orderOption = order;
        this.debounce({ order: order.toUpperCase() });
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

.category-filters {
    padding: 15px 0;
}

</style>
