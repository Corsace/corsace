<template>
    <display-layout nav-title="mappers">
        <list-transition class="ayim-layout">
            <record-item
                v-for="(recordsItems, recordName) in records"
                :key="recordName + '-record'"
                :title="recordName"
                :type="'mappers'"
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
        </list-transition>
    </display-layout>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { State } from "vuex-class";

import DisplayLayout from "../../../components/DisplayLayout.vue";
import RecordItem from "../../../components/RecordItem.vue";
import ListTransition from "../../../../MCA-AYIM/components/ListTransition.vue";

import { MapperRecord } from "../../../../Interfaces/records";
import { MCA } from "../../../../Interfaces/mca";

@Component({
    components: {
        DisplayLayout,
        RecordItem,
        ListTransition,
    },
    head () {
        return {
            title: `Mappers' Records | AYIM ${this.$route.params.year ?? (new Date()).getUTCFullYear()}`,
            meta: [
                { hid: "description", name: "description", content: `The records related to mappers in A Year in Mapping ${this.$route.params.year ?? (new Date()).getUTCFullYear()}.` },
                { hid: "og:title", property: "og:title", content: `Mappers' Records | AYIM ${this.$route.params.year ?? (new Date()).getUTCFullYear()}` },
                { hid: "og:type", property: "og:type", content: "website" },
                { hid: "og:url", property: "og:url", content: "https://ayim.corsace.io" },
                { hid: "og:description", property: "og:description", content: `The records related to mappers in A Year in Mapping ${this.$route.params.year ?? (new Date()).getUTCFullYear()}.` },
                { hid: "og:site_name",property: "og:site_name", content: "AYIM" },
                { hid: "theme-color", name: "theme-color", content: "#fb2475" },
            ],
        };
    },
})
export default class MappersRecords extends Vue {

    @State selectedMode!: string;
    @State mca!: MCA;

    records: Record<string, MapperRecord[]> = {};

    @Watch("selectedMode")
    async onSelectedModeChanged () {
        await this.getRecords();
    }

    async mounted () {
        await this.getRecords();
    }

    async getRecords () {
        const { data } = await this.$axios.get(`/api/records/mappers?year=${this.mca.year}&mode=${this.selectedMode}`);

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
        @extend %background-image;
        width: 60%;

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
        @include breakpoint(mobile) {
            height: 55px;
            width: 55px;
        }
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

        @include breakpoint(mobile) {
            font-size: 2rem;
        }

        &--small {
            font-size: 2rem;
            @include breakpoint(mobile) {
                font-size: 1rem;
            }
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
