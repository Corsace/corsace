<template>
    <display-layout nav-title="mapsets">
        <record-item
            v-for="(statisticItems, statisticName) in statistics"
            :key="statisticName"
            :title="statisticName"
        >
            <div
                v-for="statistic in statisticItems"
                :key="statistic.constraint + '-stat'"
                class="ayim-mapset-record"
            >
                <div class="ayim-mapset-record__info">
                    <div class="ayim-text ayim-text--italic">
                        number of maps with
                    </div>
                            
                    <div class="ayim-text ayim-text--xl">
                        {{ statistic.constraint }}
                    </div>
                </div>
                <div class="ayim-mapset-record__total">
                    {{ statistic.value }}
                </div>
            </div>
        </record-item>
    </display-layout>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { State } from "vuex-class";

import DisplayLayout from "../../../components/DisplayLayout.vue";
import RecordItem from "../../../components/RecordItem.vue";

import { Statistic } from "../../../../Interfaces/records";
import { MCA } from "../../../../Interfaces/mca";

@Component({
    components: {
        DisplayLayout,
        RecordItem,
    },
    head () {
        return {
            title: "Mapsets' Statistics | AYIM",
        };
    },
})
export default class MapsetStatistics extends Vue {

    @State selectedMode!: string;
    @State mca!: MCA;
    
    statistics: Record<string, Statistic[]> = {};

    @Watch("selectedMode")
    async onSelectedModeChanged () {
        await this.getStats();
    }

    async mounted () {
        await this.getStats();
    }

    async getStats () {
        const { data } = await this.$axios.get(`/api/statistics/beatmapsets?year=${this.mca.year}&mode=${this.selectedMode}`);

        if (!data.error) {
            this.statistics = data;
        }
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

</style>
