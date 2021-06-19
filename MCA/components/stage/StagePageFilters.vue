<template>
    <search-bar
        class="category-filters"
        :placeholder="$t('mca.nom_vote.search')"
        @update:search="updateText($event)"
    >
        <button
            v-if="$route.params.stage === 'voting'"
            class="button"
            :class="{ 'button--active': showVoteChoiceBox }"
            @click="toggleVoteChoiceBox"
        >
            {{ $t(`mca.nom_vote.options.voteOrder`) }}
        </button>

        <button
            v-if="section === 'beatmaps'"
            @click="updateFavourite"
            class="button button--image"
            :class="{ 'button--friends': favourites }"
        >
            <img src="../../../Assets/img/ayim-mca/site/heart.png">
        </button>

        <toggle-button
            :options="sectionOptions"
            :arrow="orderOption"
            @change="changeOption"
        />
        
        <toggle-button
            :options="orderOptions"
            :arrow="orderOption"
            @change="changeOrder"
        />
    </search-bar>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";
import _ from "lodash";

import ToggleButton from "../../../MCA-AYIM/components/ToggleButton.vue";
import SearchBar from "../../../MCA-AYIM/components/SearchBar.vue";

import { StageQuery } from "../../../Interfaces/queries";

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
    @stageModule.State showVoteChoiceBox!: boolean;
    @stageModule.Action updateQuery;
    @stageModule.Action updateFavourites;
    @stageModule.Mutation toggleVoteChoiceBox;

    beatmapOptions = ["date", "artist", "title", "favs", "creator", "sr"];
    userOptions = ["alph", "id"];
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
