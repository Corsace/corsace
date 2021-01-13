<template>
    <div class="stage__categories">
        <collapsible
            :title="'beatmap categories'"
            :list="beatmapCategories"
            :active="section === 'beatmaps'"
            :show-extra="true"
            @activate="updateSection('beatmaps')"
            @target="changeCategory"
        />
        <collapsible
            :title="'user categories'"
            :list="userCategories"
            :active="section === 'users'"
            :show-extra="true"
            @activate="updateSection('users')"
            @target="changeCategory"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace, State } from "vuex-class";

import Collapsible from "../Collapsible.vue";

import { CategoryStageInfo } from "../../../interfaces/category";

const stageModule = namespace("stage");

@Component({
    components:{
        Collapsible,
    },
})
export default class StagePageCategories extends Vue {

    @State selectedMode!: string;
    @stageModule.State section!: string;
    @stageModule.State categories!: CategoryStageInfo[];
    @stageModule.Action updateCategory;
    @stageModule.Action updateSection;
    
    get userCategories (): CategoryStageInfo[] {
        return this.categories.filter(c => c.type === "Users" && c.mode === this.selectedMode);
    }

    get beatmapCategories (): CategoryStageInfo[] {
        return this.categories.filter(c => c.type === "Beatmapsets" && c.mode === this.selectedMode);
    }

    async changeCategory (category: string) {
        this.updateCategory(category);
    }
}
</script>
