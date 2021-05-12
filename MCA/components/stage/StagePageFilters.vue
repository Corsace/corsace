<template>
    <search-bar
        :placeholder="$t('mca.nom_vote.search')"
        @update:search="updateText($event)"
    >
        <toggle-button
            :options="sectionOptions"
            @change="changeOption"
        />
        
        <toggle-button
            :options="orderOptions"
            @change="changeOrder"
        />

        <toggle-button
            v-if="$route.params.stage === 'voting'"
            :options="votingOptions"
            @change="changeVotingType"
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
    @stageModule.Action updateQuery;
    @stageModule.Mutation changeVotingType;

    beatmapOptions = ["date", "artist", "title", "favs", "creator", "sr"];
    userOptions = ["id", "alph"];
    orderOptions = ["asc", "desc"];
    votingOptions = ["incVote", "voteChoice"];

    get sectionOptions () {
        if (this.section === "beatmaps") return this.beatmapOptions;
        return this.userOptions;
    }

    updateText (text: string) {
        this.updateQuery({ text });
    }

    changeOption (option: string) {
        this.debounce({ option });
    }

    changeOrder (order: string) {
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
