<template>    
<<<<<<< HEAD
<<<<<<< HEAD
    <div class="results-filters">
=======
    <div class="results-filter">
>>>>>>> preliminary commit for results page
=======
    <div class="results-filters">
>>>>>>> fix results filter css overflow and results table height
        <div class="category-selector">
            <dropdown-selector
                :options="localCatTypes" 
                :currentOption="activeCategoryType"
<<<<<<< HEAD
                :styleLabel="catTypeStyle"
=======
                :styleLabel="categoryTypeStyle"
>>>>>>> preliminary commit for results page
                :styleDrop="catTypeDropStyle"
                class="category-type"
                @relayOption="changeCategoryType"
            />
            <dropdown-selector 
                :options="localAppCategories"
                :currentOption="activeCategory"
<<<<<<< HEAD
                :styleLabel="catStyle"
=======
                :styleLabel="categoryStyle"
>>>>>>> preliminary commit for results page
                :styleDrop="catDropStyle"
                class="award-category"
                @relayOption="changeCategory"
            />
<<<<<<< HEAD
<<<<<<< HEAD
        </div> 
        <stage-page-filters 
            class="stage-page-filters"
            results
        />
=======
        </div>
        <div class="stage-page-filters"> 
            <stage-page-filters />
        </div>
>>>>>>> preliminary commit for results page
=======
        </div> 
        <stage-page-filters class="stage-page-filters" />
>>>>>>> fix results filter css overflow and results table height
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { Mutation, State, namespace } from "vuex-class";

import DropdownSelector from "../../../MCA-AYIM/components/DropdownSelector.vue";
import StagePageFilters from "../stage/StagePageFilters.vue";

import { CategoryStageInfo, CategoryType } from "../../../Interfaces/category";
<<<<<<< HEAD
import { TranslateResult } from "vue-i18n";

=======
import { SectionCategory } from "../../../MCA-AYIM/store/stage";
import { TranslateResult } from "vue-i18n";

import _ from "lodash";

>>>>>>> preliminary commit for results page
const stageModule = namespace("stage");

@Component({
    components: {
        DropdownSelector,
        StagePageFilters
    },
<<<<<<< HEAD
=======
    head () {
        return {
            title: `results ${this.$route.params.year} | MCA`,
        };
    }
>>>>>>> preliminary commit for results page
})
export default class ResultsFilters extends Vue {
    @Mutation toggleGuestDifficultyModal;
    @State selectedMode!: string;

<<<<<<< HEAD
    @stageModule.Getter categoriesInfo!: CategoryStageInfo[];

    @stageModule.Action reset;
    @stageModule.Action updateSelectedCategory;
    @stageModule.Action updateSection;
    @stageModule.Action setInitialData;
=======
    @stageModule.State section!: SectionCategory;
    @stageModule.Getter categoriesInfo!: CategoryStageInfo[];
    @stageModule.Action reset;
    @stageModule.Action setInitialData;
    @stageModule.Action updateSelectedCategory;
    @stageModule.Action updateSection;
>>>>>>> preliminary commit for results page

    @Watch("selectedMode")
    onSelectedModeChange () {
        this.reset();
<<<<<<< HEAD
        this.updateSection("beatmaps");
        this.setInitialData();
=======
    }

    async mounted() {
        await this.setInitialData();
>>>>>>> preliminary commit for results page
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
<<<<<<< HEAD
    get catTypeStyle () {
=======
    get categoryTypeStyle () {
>>>>>>> preliminary commit for results page
        return {
            'border-radius': '5.5px 0 0 5.5px',
            'min-width': `${Math.max(85 + Math.max(...this.localCatTypes.map(lct => lct.toString().length)) * 10, 165)}px`,
            'margin-left': '5px'
        }
    }

<<<<<<< HEAD
    get catStyle () {
=======
    get categoryStyle () {
>>>>>>> preliminary commit for results page
        return {
            'border-radius': '0 5.5px 5.5px 0',
            'min-width': `${Math.max(85 + Math.max(...this.categoriesInfo.map(c => this.$t(`mca.categories.${c.name}.name`).toString().length)) * 10, 165)}px`,
            // formula to estimate box width from character count
            // flat factor (85) and scaling factor (10) are pretty arbitrary  
            'clip-path': 'inset(-8px -8px -8px 0)'
        }
    }

    get catTypeDropStyle () {
        return {
<<<<<<< HEAD
            'margin-left': this.catTypeStyle["margin-left"],
            'width': this.catTypeStyle["width"]
=======
            'margin-left': this.categoryTypeStyle["margin-left"],
            'width': this.categoryTypeStyle["width"]
>>>>>>> preliminary commit for results page
        }
    }

    get catDropStyle () {
        return {
<<<<<<< HEAD
            'width': this.catStyle["width"]
=======
            'width': this.categoryStyle["width"]
>>>>>>> preliminary commit for results page
        }
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

<<<<<<< HEAD
<<<<<<< HEAD
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
=======
.results-filter {
    display: flex;
=======
.results-filters {
>>>>>>> fix results filter css overflow and results table height
    top: 30%;
    flex: initial;

    display: flex;
    justify-content: flex-start;
    align-content: center;
    flex-wrap: wrap;
<<<<<<< HEAD
>>>>>>> preliminary commit for results page
=======
    flex-direction: column;

    @include breakpoint(laptop) {
        flex-direction: row;
    }
>>>>>>> fix results filter css overflow and results table height
}

.category-selector {
    display: flex;
<<<<<<< HEAD
<<<<<<< HEAD
    flex: 1;
=======
>>>>>>> preliminary commit for results page
=======
    flex: 1;
>>>>>>> fix results filter css overflow and results table height
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> fix results filter css overflow and results table height

    @include breakpoint(laptop) {
        flex: 10;
        max-height: 85px;
        min-width: 56rem;
    }
<<<<<<< HEAD
=======
>>>>>>> preliminary commit for results page
=======
>>>>>>> fix results filter css overflow and results table height
}
</style>