<template>
    <div class="stage">
        <stage-page-categories />
        
        <stage-page-count />
        
        <div class="stage-general">
            <stage-page-header />
            
            <stage-page-filters />

            <stage-page-list />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { namespace, State } from "vuex-class";

import StagePageCategories from "./StagePageCategories.vue";
import StagePageCount from "./StagePageCount.vue";
import StagePageHeader from "./StagePageHeader.vue";
import StagePageFilters from "./StagePageFilters.vue";
import StagePageList from "./StagePageList.vue";

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

    @State selectedMode!: string;
    @stageModule.State count!: number;
    @stageModule.Action updateStage;
    @stageModule.Action setInitialData;
    @stageModule.Action reset;

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
    height: 100%;

    @include breakpoint(laptop) {
        flex-direction: row;
    }
}

.stage-general {
    flex: 3 1 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    @include breakpoint(laptop) {
        flex: 3 1 50%;
    }
}

</style>
