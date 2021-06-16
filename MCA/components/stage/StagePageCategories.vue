<template>
    <div class="stage-categories">
        <collapsible
            :title="$t('mca.main.categories.map')"
            :list="beatmapCategories"
            :active="toUpdateSection === 'beatmaps'"
            :scroll="toUpdateSection === 'beatmaps'"
            category-name
            show-extra
            clickable
            @activate="saveSection('beatmaps')"
            @target="updateCategory($event)"
        />
        <collapsible
            :title="$t('mca.main.categories.user')"
            :list="userCategories"
            :active="toUpdateSection === 'users'"
            :scroll="toUpdateSection === 'users'"
            category-name
            show-extra
            clickable
            @activate="saveSection('users')"
            @target="updateCategory($event)"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace, State } from "vuex-class";

import Collapsible from "../../../MCA-AYIM/components/Collapsible.vue";

import { CategoryStageInfo, CategoryType } from "../../../Interfaces/category";
import { Vote } from "../../../Interfaces/vote";
import { Nomination } from "../../../Interfaces/nomination";
import { StageType } from "../../../MCA-AYIM/store/stage";

const stageModule = namespace("stage");

@Component({
    components:{
        Collapsible,
    },
})
export default class StagePageCategories extends Vue {

    @State selectedMode!: string;
    @stageModule.State votes!: Vote[];
    @stageModule.State nominations!: Nomination[];
    @stageModule.State section!: string;
    @stageModule.State stage!: StageType;
    @stageModule.Getter categoriesInfo!: CategoryStageInfo[];
    @stageModule.Action updateSelectedCategory;
    @stageModule.Action updateSection;
    @stageModule.Action reset;
    
    toUpdateSection = "";

    mounted () {
        this.toUpdateSection = this.section || "";
    }
    
    get userCategories (): CategoryStageInfo[] {
        return this.filterCategories(CategoryType.Users);
    }

    get beatmapCategories (): CategoryStageInfo[] {
        return this.filterCategories(CategoryType.Beatmapsets);
    }

    // Only change the choices list on category change
    saveSection (section: string): void {
        this.toUpdateSection = section;
        this.reset();
    }

    updateCategory (category: string): void {
        this.reset();
        this.updateSection(this.toUpdateSection);
        this.updateSelectedCategory(category);
    }

    hasVotedGrand (type: CategoryType): boolean {
        const arr = this.stage === "nominating" ? this.nominations : this.votes;

        return arr.some(v => 
            v.category.isRequired && 
            v.category.mode.name === this.selectedMode &&
            v.category.type === type
        );
    }

    filterCategories (type: CategoryType): CategoryStageInfo[] {
        const hasVotedGrand = this.hasVotedGrand(type);

        return this.categoriesInfo
            .filter(c => c.type === CategoryType[type] && c.mode === this.selectedMode)
            .map(c => ({
                ...c,
                inactive: !c.isRequired && !hasVotedGrand,
            }));
    }

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';

.stage-categories {
    flex: 1 1 15%;
}

</style>
