<template>
    <div class="category-selection">
        <voting-box v-if="showVoteChoiceBox" />

        <div class="category-selection__area">
            <div class="category-selection__maps">
                <template v-if="!results">
                    <template v-if="section === 'users'">
                        <choice-user-card
                            v-for="(item, i) in users"
                            :key="i"
                            :choice="item"
                            class="category-selection__beatmap"
                        />
                    </template>

                    <template v-else>
                        <choice-beatmapset-card
                            v-for="(item, i) in beatmaps"
                            :key="i"
                            :choice="item"
                            class="category-selection__beatmap"
                        />
                    </template>
                </template>

                <template v-else>
                    <template v-if="section === 'users'">
                        <results-user-card
                            v-for="(item, i) in userResults"
                            :key="i"
                            :columns="columns"
                            :choice="item"
                            :class="`results-display__user`"
                            :mobile="mobile"
                        />
                    </template>

                    <template v-else>
                        <results-beatmapset-card
                            v-for="(item, i) in beatmapsetResults"
                            :key="i"
                            :columns="columns"
                            :choice="item"
                            :class="`results-display__beatmap`"
                            :mobile="mobile"
                        />
                    </template>
                </template>

                <div
                    v-if="!results && loading"
                    class="category-selection__loading"
                >
                    Loading...
                </div>
            </div>
            <scroll-bar
                selector=".category-selection__maps"
                @bottom="results ? null : search(true)"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { namespace } from "vuex-class";

import ChoiceBeatmapsetCard from "../../../MCA-AYIM/components/ChoiceBeatmapsetCard.vue";
import ChoiceUserCard from "../ChoiceUserCard.vue";
import ResultsBeatmapsetCard from "../results/ResultsBeatmapsetCard.vue";
import ResultsUserCard from "../results/ResultsUserCard.vue";
import ScrollBar from "../../../MCA-AYIM/components/ScrollBar.vue";
import VotingBox from "./VotingBox.vue";

import { SectionCategory } from "../../../MCA-AYIM/store/stage";
import { UserChoiceInfo } from "../../../Interfaces/user";
import { BeatmapsetInfo } from "../../../Interfaces/beatmap";
import { BeatmapsetResult, UserResult, ResultColumn } from "../../../Interfaces/result";

const stageModule = namespace("stage");

@Component({
    components: {
        ChoiceBeatmapsetCard,
        ChoiceUserCard,
        ResultsBeatmapsetCard,
        ResultsUserCard,
        ScrollBar,
        VotingBox,
    },
})
export default class StagePageList extends Vue {

    @stageModule.State section!: SectionCategory;
    
    @stageModule.State users!: UserChoiceInfo[];
    @stageModule.State beatmaps!: BeatmapsetInfo[];

    @stageModule.State userResults!: UserResult[];
    @stageModule.State beatmapsetResults!: BeatmapsetResult[];

    @stageModule.State loading!: boolean;

    @stageModule.State showVoteChoiceBox!: boolean;

    @stageModule.Action search;

    @Prop({ type: Boolean, default: false }) results!: boolean;
    @Prop({ type: Array, required: false }) columns!: ResultColumn[];
    @Prop({ type: Boolean, default: false }) readonly mobile!: boolean;

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.category-selection {
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;

    &__area {
        height: 100%;
        position: relative;
        display: flex;
        flex: 1;
    }

    &__maps {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        
        overflow-y: scroll;
        scrollbar-width: none;
        margin-right: 50px; // Space for scrollbar
        position: relative;

        &::-webkit-scrollbar {
            display: none;
        }
        
        mask-image: linear-gradient(to top, transparent 0%, black 10%);
    }

    &__loading {
        @extend %flex-box;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 2rem;
    }
}

</style>