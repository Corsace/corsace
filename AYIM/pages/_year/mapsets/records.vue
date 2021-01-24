<template>
    <display-layout nav-title="mapsets">
        <record-item
            v-for="(recordsItems, recordName) in records"
            :key="recordName"
            :title="recordName"
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
                            hosted by | 
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
    </display-layout>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { State } from "vuex-class";

import DisplayLayout from "../../../components/DisplayLayout.vue";
import RecordItem from "../../../components/RecordItem.vue";

import { BeatmapsetRecord } from "../../../../Interfaces/records";
import { MCA } from "../../../../Interfaces/mca";

@Component({
    components: {
        DisplayLayout,
        RecordItem,
    },
    head () {
        return {
            title: "Mapsets' Records | AYIM",
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
        flex-wrap: wrap;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
}
</style>
