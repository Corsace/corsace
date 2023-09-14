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
            expand
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
            expand
            @activate="saveSection('users')"
            @target="updateCategory($event)"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";

import Collapsible from "../../../Assets/components/mca-ayim/Collapsible.vue";

import { CategoryStageInfo, CategoryType } from "../../../Interfaces/category";
import { Vote } from "../../../Interfaces/vote";
import { Nomination } from "../../../Interfaces/nomination";
import { StageType } from "../../../Interfaces/mca";

const mcaAyimModule = namespace("mca-ayim");
const stageModule = namespace("stage");

@Component({
    components:{
        Collapsible,
    },
})
export default class StagePageCategories extends Vue {

    @mcaAyimModule.State selectedMode!: string;
    @stageModule.State votes!: Vote[];
    @stageModule.State nominations!: Nomination[];
    @stageModule.State section!: string;
    @stageModule.State stage!: StageType;
    @stageModule.Getter categoriesInfo!: CategoryStageInfo[];
    @stageModule.Action updateSelectedCategory!: (category: string) => void;
    @stageModule.Action updateSection!: (section: string) => void;
    @stageModule.Action reset!: (sectionReset?: boolean) => void;
    
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
        this.reset(true);
    }

    updateCategory (category: string): void {
        this.reset();
        this.updateSection(this.toUpdateSection);
        this.updateSelectedCategory(category);
    }

    filterCategories (type: CategoryType): CategoryStageInfo[] {
        return this.categoriesInfo
            .filter(c => c.type === CategoryType[type] && (c.mode === this.selectedMode || c.mode === "storyboard"));
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';

.stage-categories {
    display: flex;
    flex-direction: row;
    @include breakpoint(laptop) {
        flex-direction: column;
    }
    gap: 10px;

    height: fit-content;

    padding-right: 10px;
    padding-bottom: 10px;

    scrollbar-width: thin;
    &::-webkit-scrollbar {
        width: 7px;
    }
    &::-webkit-scrollbar-thumb {
        background: #5f5f5f;
    }
}

</style>
