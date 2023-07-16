<template>
    <div class="mappool">
        <div class="mappool__temp_wrapper">
            <div class="mappool__temp_wrapper_left" />
            <div class="mappool__main_content">
                <OpenTitle>
                    {{ $t('open.mappool.title') }}
                    <template #buttons>
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
            <div class="mappool__temp_wrapper_right" />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component} from "vue-property-decorator";
import { namespace } from "vuex-class";

import MappoolView from "../../Assets/components/open/MappoolView.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";

import { Tournament } from "../../Interfaces/tournament";
import { Stage } from "../../Interfaces/stage";

const openModule = namespace("open");

@Component({
    components: {
        MappoolView,
        OpenTitle,
    },
    head () {
        return {
            title: "Corsace Open",
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
    &__temp_wrapper {
        display: flex;
        flex-direction: row;
        align-self: center;
        align-items: center;
        &_left {
            cursor: pointer;
            position: fixed;
            top: 50%;
            left: 5%;
            padding-right: 30px;
            width: 0;
            height: 0;
            border-width: 50px 86.6px 50px 0;
            border-color: transparent $open-red transparent transparent;
            border-style: solid;
            filter: drop-shadow(0 0 0.75rem $open-red);
        }
        &_right {
            cursor: pointer;
            position: fixed;
            top: 50%;
            right: 5%;
            padding-left: 30px;
            width: 0;
            height: 0;
            border-width: 50px 0 50px 86.6px;
            border-color: transparent transparent transparent $open-red;
            border-style: solid;
            filter: drop-shadow(0 0 0.75rem $open-red);
        }
    }
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