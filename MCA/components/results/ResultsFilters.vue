<template>    
    <div class="results-filters">
        <div class="category-selector">
            <dropdown-selector
                :options="localCatTypes" 
                :currentOption="activeCategoryType"
                :styleLabel="catTypeStyle"
                :styleDrop="catTypeDropStyle"
                class="category-type"
                @relayOption="changeCategoryType"
            />
            <dropdown-selector 
                :options="localAppCategories"
                :currentOption="activeCategory"
                :styleLabel="catStyle"
                :styleDrop="catDropStyle"
                class="award-category"
                @relayOption="changeCategory"
            />
        </div> 
        <stage-page-filters 
            class="stage-page-filters"
            results
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { Mutation, State, namespace } from "vuex-class";

import DropdownSelector from "../../../MCA-AYIM/components/DropdownSelector.vue";
import StagePageFilters from "../stage/StagePageFilters.vue";

import { CategoryStageInfo, CategoryType } from "../../../Interfaces/category";
import { TranslateResult } from "vue-i18n";

const stageModule = namespace("stage");

@Component({
    components: {
        DropdownSelector,
        StagePageFilters
    },
})
export default class ResultsFilters extends Vue {
    @Mutation toggleGuestDifficultyModal;
    @State selectedMode!: string;

    @stageModule.Getter categoriesInfo!: CategoryStageInfo[];

    @stageModule.Action reset;
    @stageModule.Action updateSelectedCategory;
    @stageModule.Action updateSection;
    @stageModule.Action setInitialData;

    @Watch("selectedMode")
    onSelectedModeChange () {
        this.reset();
        this.updateSection("beatmaps");
        this.setInitialData();
    }

    filterCategories (type: CategoryType): CategoryStageInfo[] {
        return this.categoriesInfo
            .filter(c => c.type === CategoryType[type] && c.mode === this.selectedMode);
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
    get catTypeStyle () {
        return {
            'border-radius': '5.5px 0 0 5.5px',
            'width': `${Math.max(85 + Math.max(...this.localCatTypes.map(lct => lct.toString().length)) * 10, 165)}px`,
            'margin-left': '5px'
        }
    }

    get catStyle () {
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
            'margin-left': this.catTypeStyle["margin-left"],
            'width': this.catTypeStyle["width"]
        }
    }

    get catDropStyle () {
        return {
            'width': this.catStyle["width"]
        }
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.results-filters {
    top: 30%;
    flex: initial;

    display: flex;
    justify-content: flex-start;
    align-content: center;
    flex-wrap: wrap;
    flex-direction: column;

    @include breakpoint(laptop) {
        flex-direction: row;
    }
}

.category-selector {
    display: flex;
    flex: 1;
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

    @include breakpoint(laptop) {
        flex: 10;
        max-height: 85px;
        min-width: 56rem;
    }
}
</style>