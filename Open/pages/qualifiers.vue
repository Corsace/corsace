<template>
    <div class="qualifiers">
        <div class="qualifiers__sub_header">
            <div
                class="qualifiers__sub_header_item"
                :class="{ 'qualifiers__sub_header_item--active': page === 'mappool' }"
                @click="page = 'mappool'"
            >
                {{ $t('open.qualifiers.nav.mappool') }}
            </div>
            <div
                class="qualifiers__sub_header_item"
                :class="{ 'qualifiers__sub_header_item--active': page === 'qualifiers' }"
                @click="page = 'qualifiers'"
            >
                {{ $t('open.qualifiers.nav.qualifiers') }}
            </div>
            <div
                class="qualifiers__sub_header_item"
                :class="{ 'qualifiers__sub_header_item--active': page === 'scores' }"
                @click="page = 'scores'"
            >
                {{ $t('open.qualifiers.nav.scores') }}
            </div>
        </div>
        <div class="qualifiers__main_content">
            <div class="qualifiers__title_group">
                <div class="qualifiers__title">
                    {{ $t('open.qualifiers.nav.qualifiers') }}
                </div>
                <div
                    v-if="page === 'mappool' && qualifiersStage?.mappool?.[0].isPublic"
                    class="qualifiers__button_group"
                >
                    <a class="qualifiers__button">
                        <div class="qualifiers__button_text">
                            {{ $t('open.qualifiers.mappool.sheets') }}
                        </div>
                        <img 
                            class="qualifiers__button_ico" 
                            src="../../Assets/img/site/open/sheets-ico.svg"
                        >
                    </a>
                    <a 
                        v-if="page === 'mappool'"
                        :href="qualifiersStage?.mappool?.[0].mappackLink || ''"
                        class="qualifiers__button"
                    >
                        <div class="qualifiers__button_text">
                            {{ $t('open.qualifiers.mappool.mappool') }}
                        </div>
                        <img 
                            class="qualifiers__button_ico"
                            src="../../Assets/img/site/open/dl-ico.svg"
                        >
                    </a>
                </div>
                <div
                    v-if="page === 'scores'"
                    class="qualifiers__button_group"
                >
                    <div class="qualifiers__header_subtext">
                        <span>{{ $t('open.qualifiers.scores.category') }}</span>
                        <span>{{ $t('open.qualifiers.scores.select') }}</span>
                    </div>
                    <ContentButton class="content_button--header_button content_button--red_outline">
                        {{ $t('open.qualifiers.scores.players') }}
                    </ContentButton>
                    <ContentButton class="content_button--header_button content_button--red">
                        {{ $t('open.qualifiers.scores.teams') }}
                    </ContentButton>
                </div>
            </div>
            <hr class="line--red line--bottom-space">
            <hr class="line--red line--bottom-space">
            <MappoolView 
                v-if="page === 'mappool' && qualifiersStage?.mappool?.[0].isPublic"
                :pool="qualifiersStage.mappool[0]"
            />
            <div
                v-else-if="page === 'mappool'"
                class="qualifiers__button_group"
            >
                Mappool not available yet
            </div>
            <ScoresView
                v-else-if="page === 'scores'"
                class="qualifiers__scores"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

import OpenButton from "../../Assets/components/open/OpenButton.vue";
import MappoolView from "../../Assets/components/open/MappoolView.vue";
import ContentButton from "../../Assets/components/open/ContentButton.vue";
import ScoresView from "../../Assets/components/open/ScoresView.vue";
import { Stage } from "../../Interfaces/stage";
import { namespace } from "vuex-class";
import { Tournament } from "../../Interfaces/tournament";

const openModule = namespace("open");

@Component({
    components: {
        OpenButton,
        MappoolView,
        ContentButton,
        ScoresView,
    },
    head () {
        return {
            title: "Corsace Open",
        };
    },
})
export default class Qualifiers extends Vue {

    page: "mappool" | "qualifiers" | "scores" = "mappool";

    @openModule.State tournament!: Tournament | null;

    get qualifiersStage (): Stage | null {
        return this.tournament?.stages.find(s => s.stageType === 0) || null;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.qualifiers {
    background: linear-gradient(180deg, #1F1F1F 0%, #131313 100%);

    &__sub_header {
        display: flex;
        justify-content: center;
        width: 100%;
        top: 0px;
        background-color: $open-red;
        color: $open-dark;

        &_item {
            position: relative;
            display: flex;
            justify-content: center;

            cursor: pointer;
            width: auto;
            text-decoration: none;
            font-weight: 700;
            padding: 5px 90px;

            &:hover, &--active {
                color: $white;
            }

            &--active::after {
                content: "";
                position: absolute;
                top: calc(50% - 4.5px/2);
                right: calc(100% - 4.5em);
                width: 4.5px;
                height: 4.5px;
                transform: rotate(-45deg);
                background-color: $white;
            }
        }
    }

    &__main_content {
        align-self: center;
        position: relative;
        width: 65vw;
        padding: 35px;
        background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
    }

    &__scores {
        height: 95%;
        overflow: hidden;
    }

    &__title {
        &_group {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
        }
        font-family: $font-communterssans;
        font-size: $font-title;
        font-weight: 400;
    }

    &__button {
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        flex-direction: row-reverse;
        background-color: $open-red;
        margin: 15px 0px 15px 20px;
        min-width: 150px;
        height: 30px;
        padding: 5px;

        &:hover {
            text-decoration: none;
        }

        &_group {
            display: flex;
            flex-direction: row;
        }

        &_text {
            color: $open-dark;
            font-weight: 600;
        }

        &_ico {
            vertical-align: -10%;
        }
    }

    &__header_subtext {
        font-family: $font-swis721;
        font-weight: 400;
        font-size: $font-sm;
        text-align: right;
        margin-top: 15px;
        color: #909090;
        display: flex;
        flex-direction: column;
    }
}
</style>