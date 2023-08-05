<template>
    <div class="mappool">
        <div class="mappool__main_content">
            <OpenTitle>
                {{ $t('open.mappool.title') }}
                <template #buttons>
                    <StageSelector>
                        <template #top_text>
                            {{ $t("open.components.stageSelector.stage")}}
                        </template>
                        <template #bottom_text>
                            {{ $t("open.components.stageSelector.select")}}
                        </template>

                        <template #stage>
                            QL
                        </template>
                    </StageSelector>
                    <!-- TODO: NOT MAKE THIS A STATIC LINK LOL -->
                    <a 
                        href="https://docs.google.com/spreadsheets/d/1Bl-G_jKyxxMrTtgEJ6j2uYnHtDoPz8uG_flSKWkc734/edit#gid=2089223782"
                        class="qualifiers__button"
                    >
                        <div class="qualifiers__button_text">
                            {{ $t('open.qualifiers.mappool.sheets') }}
                        </div>
                        <img 
                            class="qualifiers__button_ico" 
                            src="../../Assets/img/site/open/mappool/sheets-ico.svg"
                        >
                    </a>
                    <a
                        :href="qualifiersStage?.mappool?.[0].mappackLink || ''"
                        class="qualifiers__button"
                    >
                        <div class="qualifiers__button_text">
                            {{ $t('open.qualifiers.mappool.mappool') }}
                        </div>
                        <img 
                            class="qualifiers__button_ico"
                            src="../../Assets/img/site/open/mappool/dl-ico.svg"
                        >
                    </a>
                </template>
            </OpenTitle>
            <MappoolView
                v-if="qualifiersStage?.mappool?.[0].isPublic"
                :pool="qualifiersStage.mappool[0]"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component} from "vue-property-decorator";
import { namespace } from "vuex-class";

import MappoolView from "../../Assets/components/open/MappoolView.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import StageSelector from "../../Assets/components/open/StageSelector.vue";

import { Tournament } from "../../Interfaces/tournament";
import { Stage } from "../../Interfaces/stage";

const openModule = namespace("open");

@Component({
    components: {
        StageSelector,
        MappoolView,
        OpenTitle,
    },
    head () {
        return {
            title: this.$store.state["open"].title,
            meta: [
                {hid: "description", name: "description", content: this.$store.state["open"].tournament.description},

                {hid: "og:site_name", property: "og:site_name", content: this.$store.state["open"].title},
                {hid: "og:title", property: "og:title", content: this.$store.state["open"].title},
                {hid: "og:url", property: "og:url", content: `https://open.corsace.io${this.$route.path}`}, 
                {hid: "og:description", property: "og:description", content: this.$store.state["open"].tournament.description},
                {hid: "og:image",property: "og:image", content: require("../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state["open"].title},
                {name: "twitter:description", content: this.$store.state["open"].tournament.description},
                {name: "twitter:image", content: require("../../Assets/img/site/open/banner.png")},
                {name: "twitter:image:src", content: require("../../Assets/img/site/open/banner.png")},
            ],
            link: [{rel: "canonical", hid: "canonical", href: `https://open.corsace.io${this.$route.path}`}],
        };
    },
})
export default class Mappool extends Vue {

    @openModule.State tournament!: Tournament | null;

    get qualifiersStage (): Stage | null {
        return this.tournament?.stages.find(s => s.stageType === 0) || null;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
.mappool {
    background: linear-gradient(180deg, #1F1F1F 0%, #131313 100%);
    overflow: auto;

    &__main_content {
        align-self: center;
        position: relative;
        width: 65vw;
        padding: 35px;
        background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
    }
}
</style>
```