<template>
    <div class="category-selection">
        <voting-box v-if="showVoteChoiceBox" />

        <div class="category-selection__area">
            <div class="category-selection__maps">
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
            </div>
            <scroll-bar
                selector=".category-selection__maps"
                @bottom="search(true)"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";

import ChoiceBeatmapsetCard from "../../../MCA-AYIM/components/ChoiceBeatmapsetCard.vue";
import ChoiceUserCard from "../ChoiceUserCard.vue";
import ScrollBar from "../../../MCA-AYIM/components/ScrollBar.vue";
import VotingBox from "./VotingBox.vue";

import { SectionCategory } from "../../../MCA-AYIM/store/stage";
import { UserCondensedInfo } from "../../../Interfaces/user";
import { BeatmapsetInfo } from "../../../Interfaces/beatmap";

const stageModule = namespace("stage");

@Component({
    components: {
        ChoiceBeatmapsetCard,
        ChoiceUserCard,
        ScrollBar,
        VotingBox,
    },
})
export default class StagePageList extends Vue {

    @stageModule.State section!: SectionCategory;
    @stageModule.State users!: UserCondensedInfo[];
    @stageModule.State beatmaps!: BeatmapsetInfo[];
    @stageModule.State showVoteChoiceBox!: boolean;
    @stageModule.Action search;
    
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
        
        mask-image: linear-gradient(to top, transparent 10%, black 25%);

        @include breakpoint(tablet) {
            mask-image: linear-gradient(to top, transparent 0%, black 25%);
        }
    }
}

</style>
