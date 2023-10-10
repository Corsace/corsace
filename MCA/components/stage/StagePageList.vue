<template>
    <div 
        class="scroll__mca category-selection"
        :class="`scroll--${viewTheme}`"
    >
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
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { namespace, State } from "vuex-class";

import ChoiceBeatmapsetCard from "./ChoiceBeatmapsetCard.vue";
import ChoiceUserCard from "./ChoiceUserCard.vue";
import ResultsBeatmapsetCard from "../results/ResultsBeatmapsetCard.vue";
import ResultsUserCard from "../results/ResultsUserCard.vue";
import VotingBox from "./VotingBox.vue";

import { SectionCategory } from  "../../../Interfaces/category";
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

    @stageModule.Action search!: (skipping: boolean) => void;

    @State viewTheme!: "light" | "dark";

    @Prop({ type: Boolean, default: false }) results!: boolean;
    @Prop({ type: Array, required: false }) columns!: ResultColumn[];
    @Prop({ type: Boolean, default: false }) readonly mobile!: boolean;

    scrollPos = 0;
    scrollSize = 1;
    bottom = false;

    mounted () {
        const list = document.querySelector(".category-selection");
        if (list) {
            list.addEventListener("scroll", this.handleScroll);
        }
    }

    beforeDestroy () {
        const list = document.querySelector(".category-selection");
        if (list) {
            list.removeEventListener("scroll", this.handleScroll);
        }
    }

    handleScroll = (event: Event) => {
        if (event.target instanceof HTMLElement) {
            this.scrollPos = event.target.scrollTop;
            this.scrollSize = event.target.scrollHeight - event.target.clientHeight; // U know... just in case the window size changes Lol

            const diff = Math.abs(this.scrollSize - this.scrollPos);
            this.emit(diff <= 50);
        }
    };

    emit (currentlyBottom: boolean): void {
        if (currentlyBottom !== this.bottom) {
            this.bottom = currentlyBottom;
            if (currentlyBottom && !this.results)
                this.search(true);
        }
    }

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
    padding-right: 10px;

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
        gap: 10px;
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