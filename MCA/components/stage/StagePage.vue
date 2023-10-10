<template>
    <div class="stage">
        <stage-page-categories />
        
        <div class="stage-general">
            <stage-page-header />
            
            <stage-page-filters v-if="selectedCategory" />

            <stage-page-list v-if="selectedCategory" />

            <div 
                v-else
                class="stage-select"
            >
                <div class="stage-select__title">
                    {{ $t('mca.nom_vote.select') }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { namespace } from "vuex-class";

import StagePageCategories from "./StagePageCategories.vue";
import StagePageCount from "./StagePageCount.vue";
import StagePageHeader from "./StagePageHeader.vue";
import StagePageFilters from "./StagePageFilters.vue";
import StagePageList from "./StagePageList.vue";
import { CategoryStageInfo } from "../../../Interfaces/category";
import { StageType } from "../../../Interfaces/mca";

const mcaAyimModule = namespace("mca-ayim");
const stageModule = namespace("stage");

@Component({
    components: {
        StagePageCategories,
        StagePageCount,
        StagePageHeader,
        StagePageFilters,
        StagePageList,
    },
})
export default class StateContent extends Vue {

    @mcaAyimModule.State selectedMode!: string;

    @stageModule.State count!: number;
    @stageModule.State selectedCategory!: CategoryStageInfo;

    @stageModule.Action updateStage!: (stage: StageType) => void;
    @stageModule.Action setInitialData!: () => Promise<void>;
    @stageModule.Action reset!: (sectionReset?: boolean) => void;

    @Watch("selectedMode")
    onSelectedModeChange () {
        this.reset();
    }

    async mounted () {
        if (/^(nominating|nominate)$/.test(this.$route.params.stage))
            this.updateStage("nominating");
        else if (/^(vote|voting)$/.test(this.$route.params.stage))
            this.updateStage("voting");

        await this.setInitialData();
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.stage {
    display: flex;
    flex-direction: column;
    height: calc(100% - 55px);

    @include breakpoint(laptop) {
        flex-direction: row;
    }
}

.stage-general {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    @include breakpoint(laptop) {
        flex: 3 1 50%;
    }
}


.stage-select {
    @extend %flex-box;
    height: 100%;

    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;

    font-size: 1rem;

    &__title {
        @include breakpoint(tablet) {
            font-size: 2rem;
        }
        @include breakpoint(laptop) {
            font-size: 3rem;
        }
        @include breakpoint(desktop) {
            font-size: 4rem;
        }
    }

    &__subtitle {
        @include breakpoint(tablet) {
            font-size: 2rem;
        }
    }
}
</style>
