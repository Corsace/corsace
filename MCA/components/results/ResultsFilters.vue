<template>    
    <div class="results-filter">
        <div class="category-selector">
            <dropdown-selector
                :options="localCatTypes" 
                :currentOption="activeCategoryType"
                :styleLabel="categoryTypeStyle"
                :styleDrop="catTypeDropStyle"
                class="category-type"
                @relayOption="changeCategoryType"
            />
            <dropdown-selector 
                :options="localAppCategories"
                :currentOption="activeCategory"
                :styleLabel="categoryStyle"
                :styleDrop="catDropStyle"
                class="award-category"
                @relayOption="changeCategory"
            />
        </div>
        <div class="stage-page-filters"> 
            <stage-page-filters />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { Mutation, State, namespace } from "vuex-class";

import DropdownSelector from "../../../MCA-AYIM/components/DropdownSelector.vue";
import StagePageFilters from "../stage/StagePageFilters.vue";

import { CategoryStageInfo, CategoryType } from "../../../Interfaces/category";
import { SectionCategory } from "../../../MCA-AYIM/store/stage";
import { TranslateResult } from "vue-i18n";

import _ from "lodash";

const stageModule = namespace("stage");

@Component({
    components: {
        DropdownSelector,
        StagePageFilters
    },
    head () {
        return {
            title: `results ${this.$route.params.year} | MCA`,
        };
    }
})
export default class ResultsFilters extends Vue {
    @Mutation toggleGuestDifficultyModal;
    @State selectedMode!: string;

    @stageModule.State section!: SectionCategory;
    @stageModule.Getter categoriesInfo!: CategoryStageInfo[];
    @stageModule.Action reset;
    @stageModule.Action setInitialData;
    @stageModule.Action updateSelectedCategory;
    @stageModule.Action updateSection;

    @Watch("selectedMode")
    onSelectedModeChange () {
        this.reset();
    }

    async mounted() {
        await this.setInitialData();
    }

    filterCategories (type: CategoryType): CategoryStageInfo[] {
        return this.categoriesInfo
            .filter(c => c.type === CategoryType[type] && c.mode === this.selectedMode)
            .map(c => ({
                ...c,
                inactive: !c.isRequired
            }));
    }

    // track current index of arrays selected by dropdowns
    activeCategoryType = <CategoryType> 0;
    activeCategory = 0;

    // dropdown lists
    get localCatTypes (): TranslateResult[] {
        return [this.$t(`mca.main.categories.map`), this.$t(`mca.main.categories.user`)];
    }

    get localAppCategories (): TranslateResult[] {
        return this.filterCategories(this.activeCategoryType).map(c => this.$t(`mca.categories.${c.name}.name`));
    }


    // change category index on dropdown selection
    changeCategoryType (newCategoryType: number) {
        this.activeCategoryType = <CategoryType> newCategoryType;
        this.changeCategory(0);
    }

    changeCategory (newCategory: number) {
        this.activeCategory = newCategory;
        this.updateCategory(this.filterCategories(this.activeCategoryType)[this.activeCategory]);
    }

    // change category used by stage
    updateCategory (category: CategoryStageInfo): void {
        this.reset();
        this.updateSection(this.activeCategoryType ? "users" : "beatmaps");
        this.updateSelectedCategory(category);
    }

    // dropdown styles
    get categoryTypeStyle () {
        return {
            'border-radius': '5.5px 0 0 5.5px',
            'width': `${Math.max(85 + Math.max(...this.localCatTypes.map(lct => lct.toString().length)) * 10, 165)}px`,
            'margin-left': '5px'
        }
    }

    get categoryStyle () {
        return {
            'border-radius': '0 5.5px 5.5px 0',
            'width': `${Math.max(85 + Math.max(...this.categoriesInfo.map(c => this.$t(`mca.categories.${c.name}.name`).toString().length)) * 10, 165)}px`,
            // formula to estimate box width from character count
            // flat factor (85) and scaling factor (10) are pretty arbitrary  
            'clip-path': 'inset(-8px -8px -8px 0)'
        }
    }

    get catTypeDropStyle () {
        return {
            'margin-left': this.categoryTypeStyle["margin-left"],
            'width': this.categoryTypeStyle["width"]
        }
    }

    get catDropStyle () {
        return {
            'width': this.categoryStyle["width"]
        }
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.results-filter {
    display: flex;
    top: 30%;
    justify-content: flex-start;
    align-content: center;
    flex-wrap: wrap;
}

.category-selector {
    display: flex;
    justify-content: center;

    padding: 20px 0 0 0;

    @include breakpoint(tablet) {
        padding: 0;
    }

    @include breakpoint(desktop) {
        padding: 20px 0 0 0;
    }
}

.stage-page-filters {
    flex: 1;
}
</style>