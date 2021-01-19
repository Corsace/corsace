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
                    class="ayim-record"
                    :href="`https://osu.ppy.sh/beatmapsets/${record.beatmapset.id}`"
                    target="_blank"
                >
                    <div
                        class="ayim-record__image"
                        :style="`background-image: url('https://assets.ppy.sh/beatmaps/${record.beatmapset.id}/covers/cover.jpg')`"
                    />
                    <div class="ayim-record__info">
                        <div class="ayim-text ayim-text--lg">
                            {{ record.beatmapset.title }}
                        </div>
                                
                        <div class="ayim-text">
                            {{ record.beatmapset.artist }}
                        </div>
                        <div class="ayim-record__description">
                            hosted by | 
                            <span class="ayim-text ayim-text--italic">
                                {{ record.creator.username }}
                            </span>
                        </div>
                    </div>
                    <div class="ayim-record__total">
                        {{ record.value }}
                    </div>
                </a>
                        
                <a
                    v-else
                    :key="i + '-record'"
                    class="ayim-record ayim-record--small"
                    :href="`https://osu.ppy.sh/beatmapsets/${record.beatmapset.id}`"
                    target="_blank"
                >
                    <div
                        class="ayim-record__image"
                        :style="`background-image: url('https://assets.ppy.sh/beatmaps/${record.beatmapset.id}/covers/cover.jpg')`"
                    />
                    <div class="ayim-text">
                        {{ record.beatmapset.title }}
                    </div>
                    <div class="ayim-record__total ayim-record__total--small">
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
import axios from "axios";

import DisplayLayout from "../../../components/DisplayLayout.vue";
import RecordItem from "../../../components/RecordItem.vue";

import { BeatmapsetRecord } from "../../../../Interfaces/records";

@Component({
    components: {
        DisplayLayout,
        RecordItem,
    },
})
export default class Records extends Vue {

    @State selectedMode!: string;
    @State year!: string;

    records: Record<string, BeatmapsetRecord[]> = {};

    @Watch("selectedMode")
    async onSelectedModeChanged () {
        await this.getRecords();
    }

    async mounted () {
        await this.getRecords();
    }

    async getRecords () {
        const { data } = await axios.get(`/api/records/beatmapsets?year=${this.year}&mode=${this.selectedMode}`);

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

.ayim-record {
    @extend %flex-box;
    flex-direction: column;
    box-shadow: $gray-shadow;
    position: relative;

    &__image {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 100%;
        background-repeat: no-repeat;
        background-size: cover;
        opacity: 0.7;
        z-index: -1;
        border-radius: inherit;
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
