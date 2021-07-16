<template>
    <display-layout nav-title="mappers">
        <list-transition class="ayim-layout">
            <record-item
                v-for="(statisticItems, statisticName) in statistics"
                :key="statisticName + '-stat'"
                :title="statisticName"
                :type="'mappers'"
            >
                <div
                    v-for="statistic in statisticItems"
                    :key="statistic.constraint + '-stat'"
                    class="ayim-mapset-record"
                >
                    <div class="ayim-mapset-record__info">
                        <div class="ayim-text ayim-text--italic">
                            {{ $t('ayim.statistics.numberOf') }}
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
        </list-transition>
    </display-layout>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { State } from "vuex-class";

import DisplayLayout from "../../../components/DisplayLayout.vue";
import RecordItem from "../../../components/RecordItem.vue";
import ListTransition from "../../../../MCA-AYIM/components/ListTransition.vue";

import { Statistic } from "../../../../Interfaces/records";
import { MCA } from "../../../../Interfaces/mca";

@Component({
    components: {
        DisplayLayout,
        RecordItem,
        ListTransition,
    },
    head () {
        return {
            title: `Mappers' Statistics | AYIM ${this.$route.params.year ?? (new Date()).getUTCFullYear()}`,
            meta: [
                { hid: "description", name: "description", content: `The statistics related to mappers in A Year in Mapping ${this.$route.params.year ?? (new Date()).getUTCFullYear()}.` },
                { hid: "og:title", property: "og:title", content: `Mappers' Statistics | AYIM ${this.$route.params.year ?? (new Date()).getUTCFullYear()}` },
                { hid: "og:type", property: "og:type", content: "website" },
                { hid: "og:url", property: "og:url", content: "https://ayim.corsace.io" },
                { hid: "og:description", property: "og:description", content: `The statistics related to mappers in A Year in Mapping ${this.$route.params.year ?? (new Date()).getUTCFullYear()}.` },
                { hid: "og:site_name",property: "og:site_name", content: "AYIM" },
                { hid: "theme-color", name: "theme-color", content: "#fb2475" },
            ],
        };
    },
})
export default class MapperStatistics extends Vue {

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
        const { data } = await this.$axios.get(`/api/statistics/mappers?year=${this.mca.year}&mode=${this.selectedMode}`);

        if (!data.error) {
            this.statistics = data;
        }
    }
    
}
</script>
