<template>
    <display-layout nav-title="mapsets">
        <list-transition class="ayim-layout">
            <record-item
                v-for="(recordsItems, recordName) in records"
                :key="recordName + '-record'"
                :title="recordName"
                :type="'mapsets'"
            >
                <template v-for="(record, i) in recordsItems">
                    <a
                        v-if="i == 0"
                        :key="i + '-record'"
                        class="ayim-mapset-record"
                        :href="`https://osu.ppy.sh/beatmapsets/${record.beatmapset.id}`"
                        target="_blank"
                    >
                        <div
                            class="ayim-mapset-record__image"
                            :style="`background-image: url('https://assets.ppy.sh/beatmaps/${record.beatmapset.id}/covers/cover.jpg')`"
                        />
                        <div class="ayim-mapset-record__info">
                            <div class="ayim-text ayim-text--xl">
                                {{ record.beatmapset.title }}
                            </div>
                                
                            <div class="ayim-text">
                                {{ record.beatmapset.artist }}
                            </div>
                            <div class="ayim-mapset-record__description">
                                {{ $t('mca.nom_vote.hosted') }} | 
                                <span class="ayim-text ayim-text--italic">
                                    {{ record.creator.username }}
                                </span>
                            </div>
                        </div>
                        <div class="ayim-mapset-record__total">
                            {{ record.value }}
                        </div>
                    </a>
                        
                    <a
                        v-else
                        :key="i + '-record'"
                        class="ayim-mapset-record ayim-mapset-record--small"
                        :href="`https://osu.ppy.sh/beatmapsets/${record.beatmapset.id}`"
                        target="_blank"
                    >
                        <div
                            class="ayim-mapset-record__image"
                            :style="`background-image: url('https://assets.ppy.sh/beatmaps/${record.beatmapset.id}/covers/cover.jpg')`"
                        />
                        <div class="ayim-text">
                            {{ record.beatmapset.title }}
                        </div>
                        <div class="ayim-mapset-record__total ayim-mapset-record__total--small">
                            {{ record.value }}
                        </div>
                    </a>
                </template>
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

import { BeatmapsetRecord } from "../../../../Interfaces/records";
import { MCA } from "../../../../Interfaces/mca";

@Component({
    components: {
        DisplayLayout,
        RecordItem,
        ListTransition,
    },
    head () {
        return {
            title: `Mapsets' Records | AYIM ${this.$route.params.year ?? (new Date()).getUTCFullYear()}`,
            meta: [
                { hid: "description", name: "description", content: `The records related to mapsets in A Year in Mapping ${this.$route.params.year ?? (new Date()).getUTCFullYear()}.` },
                { hid: "og:title", property: "og:title", content: `Mapsets' Records | AYIM ${this.$route.params.year ?? (new Date()).getUTCFullYear()}` },
                { hid: "og:type", property: "og:type", content: "website" },
                { hid: "og:url", property: "og:url", content: "https://ayim.corsace.io" },
                { hid: "og:description", property: "og:description", content: `The records related to mapsets in A Year in Mapping ${this.$route.params.year ?? (new Date()).getUTCFullYear()}.` },
                { hid: "og:site_name",property: "og:site_name", content: "AYIM" },
                { hid: "theme-color", name: "theme-color", content: "#fb2475" },
            ],
        };
    },
})
export default class MapsetRecords extends Vue {

    @State selectedMode!: string;
    @State mca!: MCA;

    records: Record<string, BeatmapsetRecord[]> = {};

    @Watch("selectedMode")
    async onSelectedModeChanged () {
        await this.getRecords();
    }

    async mounted () {
        await this.getRecords();
    }

    async getRecords () {
        const { data } = await this.$axios.get(`/api/records/beatmapsets?year=${this.mca.year}&mode=${this.selectedMode}`);

        if (!data.error) {
            this.records = data;
        }
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.ayim-mapset-record {
    @extend %ayim-record;

    &__image {
        @extend %background-image;
    }

    &__total {
        text-align: right;
        font-family: $font-scoreboard;
        font-size: 3rem;

        &--small {
            font-size: 2rem;
        }
    }

    &--small {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
}
</style>
