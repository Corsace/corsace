<template>    
    <div class="results-filters">
        <div class="category-selector">
            <dropdown-selector
                :options="localCatTypes" 
                :current-option="activeCategoryType"
                :style-label="catTypeStyle"
                :style-drop="catTypeDropStyle"
                class="category-type"
                @relayOption="changeCategoryType"
            />
            <dropdown-selector 
                :options="localAppCategories"
                :current-option="activeCategory"
                :style-label="catStyle"
                :style-drop="catDropStyle"
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
        StagePageFilters,
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
            .filter(c => c.type === CategoryType[type] && (c.mode === this.selectedMode || c.mode === "storyboard"));
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
        const longestStr = Math.max(...this.localCatTypes.map(lct => lct.toString().length));
        return {
            "width": `${longestStr * 0.82}em`,
        };
    }

    get catStyle () {
        const longestStr = Math.max(...this.categoriesInfo.map(c => this.$t(`mca.categories.${c.name}.name`).toString().length));
        return {
            "width": `${longestStr * 0.82}em`,
            "clip-path": "inset(-8px -8px -8px 0)",
        };
    }

    get catTypeDropStyle () {
        return {
            "margin-left": this.catTypeStyle["margin-left"],
            "width": this.catTypeStyle["width"],
        };
    }

    get catDropStyle () {
        return {
            "width": this.catStyle["width"],
        };
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

// this determines the width of stage-page-filters at which it wraps below
//   the dropdowns
$two-row-breakpoint: 35rem;

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
    justify-content: center;
    flex-direction: column;

    flex: 1;

    padding: 0;

    @include breakpoint(tablet) {
        flex-direction: row;
    }

    @include breakpoint(desktop) {
        padding: 20px 0 0 0;
    }

    >div {
        flex: 1;
    }
}

.category-type {
    margin: 15px 5px 7.5px 5px;
    border-radius: 5.5px;

    @include breakpoint(tablet) {
        margin: 0;
        border-radius: 5.5px 0 0 5.5px;
    }

    @include breakpoint(laptop) {
        margin: 0 0 0 5px;
    }
}

.award-category {
    margin: 7.5px 5px 0 5px;
    border-radius: 5.5px;

    @include breakpoint(tablet) {
        margin: 0;
        border-radius: 0 5.5px 5.5px 0;
    }

    @include breakpoint(laptop) {
        margin: 0 5px 0 0;
    }
}

.stage-page-filters {
    flex: 1;

    @include breakpoint(laptop) {
        flex: 10;
        max-height: 85px;
        min-width: $two-row-breakpoint;
    }
}
</style>