<template>
    <div class="category__selection">
        <div class="category__selection-search">
            <stage-page-filters />
        </div>

        <div class="category__selection-area">
            <div class="category__selection-maps">
                <template v-if="section === 'users'">
                    <choice-user-card
                        v-for="(item, i) in users"
                        :key="i"
                        :choice="item"
                        class="category__beatmap"
                        @choose="nominate(item)"
                    />
                </template>

                <template v-else>
                    <choice-beatmapset-card
                        v-for="(item, i) in beatmaps"
                        :key="i"
                        :choice="item"
                        class="category__beatmap"
                        @choose="nominate(item)"
                    />
                </template>
            </div>
            <scroll-bar
                selector=".category__selection-maps"
                @bottom="search(true)"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";
import axios from "axios";

import StagePageFilters from "./StagePageFilters.vue";
import ChoiceBeatmapsetCard from "../ChoiceBeatmapsetCard.vue";
import ChoiceUserCard from "../ChoiceUserCard.vue";
import ScrollBar from "../ScrollBar.vue";

import { CategoryStageInfo } from "../../../Interfaces/category";
import { SectionCategory } from "../../store/stage";
import { UserCondensedInfo } from "../../../Interfaces/user";
import { BeatmapsetInfo } from "../../../Interfaces/beatmap";

const stageModule = namespace("stage");

@Component({
    components: {
        StagePageFilters,
        ChoiceBeatmapsetCard,
        ChoiceUserCard,
        ScrollBar,
    },
})
export default class StagePageList extends Vue {

    @stageModule.State selectedCategory!: CategoryStageInfo;
    @stageModule.State section!: SectionCategory;
    @stageModule.State users!: UserCondensedInfo[];
    @stageModule.State beatmaps!: BeatmapsetInfo[];
    @stageModule.Action updateBeatmapState;
    @stageModule.Action updateUserState;
    @stageModule.Action search;
    
    async nominate (choice) {
        if (!this.selectedCategory) return;

        let res: { error?: string };
        
        if (!choice.chosen) {
            res = (await axios.post(`/api/nominating/create`, {
                categoryId: this.selectedCategory.id,
                nomineeId: this.section === "beatmaps" ? choice.id : choice.corsaceID,
            })).data;
        } else
            res = (await axios.delete(`/api/nominating/remove/${this.selectedCategory.id}/${this.section === "beatmaps" ? choice.id : choice.corsaceID}`)).data;

        if (res.error)
            return alert(res.error);
        
        if (this.section === "beatmaps") {
            this.updateBeatmapState(choice.id);
        } else if (this.section === "users") {
            this.updateUserState(choice.corsaceID);
        }
    }

}
</script>
