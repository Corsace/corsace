<template>
    <div class="stage__categories">
        <collapsible
            :title="$t('mca.main.categories.map')"
            :list="beatmapCategories"
            :active="toUpdateSection === 'beatmaps'"
            :categoryName="true"
            :show-extra="true"
            @activate="saveSection('beatmaps')"
            @target="updateCategory($event)"
        />
        <collapsible
            :title="$t('mca.main.categories.user')"
            :list="userCategories"
            :active="toUpdateSection === 'users'"
            :categoryName="true"
            :show-extra="true"
            @activate="saveSection('users')"
            @target="updateCategory($event)"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace, State } from "vuex-class";

import Collapsible from "../../../MCA-AYIM/components/Collapsible.vue";

import { CategoryStageInfo } from "../../../Interfaces/category";

const stageModule = namespace("stage");

@Component({
    components:{
        Collapsible,
    },
})
export default class StagePageCategories extends Vue {

    @State selectedMode!: string;
    @stageModule.State section!: string;
    @stageModule.Getter categoriesInfo!: CategoryStageInfo[];
    @stageModule.Action updateSelectedCategory;
    @stageModule.Action updateSection;
    @stageModule.Action reset;
    
    toUpdateSection = "";

    mounted () {
        this.toUpdateSection = this.section || "";
    }
    
    get userCategories (): CategoryStageInfo[] {
        return this.categoriesInfo.filter(c => c.type === "Users" && c.mode === this.selectedMode);
    }

    get beatmapCategories (): CategoryStageInfo[] {
        return this.categoriesInfo.filter(c => c.type === "Beatmapsets" && c.mode === this.selectedMode);
    }

    // Only change the choices list on category change
    saveSection (section: string): void {
        this.toUpdateSection = section;
        this.reset();
    }

    updateCategory (category: string): void {
        this.updateSection(this.toUpdateSection);
        this.updateSelectedCategory(category);
    }

}
</script>
