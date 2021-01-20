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
                    class="ayim-mapper-record"
                    :href="`https://osu.ppy.sh/users/${record.osuId}`"
                    target="_blank"
                >
                    <div
                        class="ayim-mapper-record__image"
                        :style="`background-image: url('https://a.ppy.sh/${record.osuId}')`"
                    />

                    <img
                        :src="`https://a.ppy.sh/${record.osuId}`"
                        class="ayim-mapper-record__avatar"
                    >

                    <div class="ayim-mapper-record__info">
                        <div class="ayim-text ayim-text--xxl">
                            {{ record.username }}
                        </div>
                        <div class="ayim-mapper-record__total">
                            {{ record.value }}
                        </div>
                    </div>
                </a>
                        
                <a
                    v-else
                    :key="i + '-record'"
                    class="ayim-mapper-record ayim-mapper-record--small"
                    :href="`https://osu.ppy.sh/users/${record.osuId}`"
                    target="_blank"
                >
                    <div
                        class="ayim-mapper-record__image ayim-mapper-record__image--small"
                        :style="`background-image: url('https://a.ppy.sh/${record.osuId}')`"
                    />
                    <div class="ayim-mapper-record__info ayim-mapper-record__info--small">
                        <div class="ayim-text ayim-text--lg">
                            {{ record.username }}
                        </div>
                        <div class="ayim-mapper-record__total ayim-mapper-record__total--small">
                            {{ record.value }}
                        </div>
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

import { MapperRecord } from "../../../../Interfaces/records";

@Component({
    components: {
        DisplayLayout,
        RecordItem,
    },
})
export default class MappersRecords extends Vue {

    @State selectedMode!: string;
    @State year!: string;

    records: Record<string, MapperRecord[]> = {};

    @Watch("selectedMode")
    async onSelectedModeChanged () {
        await this.getRecords();
    }

    async mounted () {
        await this.getRecords();
    }

    async getRecords () {
        const { data } = await axios.get(`/api/records/mappers?year=${this.year}&mode=${this.selectedMode}`);

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

.ayim-mapper-record {
    @extend %ayim-record;
    
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(103deg, transparent 0%, black 60%);
    height: auto;

    &__image {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 60%;
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center;
        opacity: 0.7;
        z-index: -1;
        border-radius: inherit;

        &--small {
            width: 30%;
        }
    }

    &__avatar {
        height: 110px;
        width: 110px;
        border-radius: 100%;
        box-shadow: $gray-shadow;
        margin: 10px 0;
    }

    &__info {
        text-align: right;

        &--small {
            padding-left: 30%;
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }
    }

    &__total {
        font-family: $font-scoreboard;
        font-size: 4rem;

        &--small {
            font-size: 2rem;
        }
    }

    &--small {
        flex-wrap: wrap;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(103deg, transparent 0%, black 30%);
    }
}
</style>
