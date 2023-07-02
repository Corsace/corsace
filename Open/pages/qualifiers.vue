<template>
    <div class="qualifiers">
        <div class="qualifiers__sub_header">
            <div
                class="qualifiers__sub_header_item"
                :class="{ 'qualifiers__sub_header_item--active': page === 'mappool' }"
                @click="page = 'mappool'"
            >
                MAPPOOL
            </div>
            <div
                class="qualifiers__sub_header_item"
                :class="{ 'qualifiers__sub_header_item--active': page === 'qualifiers' }"
                @click="page = 'qualifiers'"
            >
                QUALIFIERS
            </div>
            <div
                class="qualifiers__sub_header_item"
                :class="{ 'qualifiers__sub_header_item--active': page === 'scores' }"
                @click="page = 'scores'"
            >
                SCORES
            </div>
        </div>
        <div class="qualifiers__main_content">
            <div class="qualifiers__title_group">
                <div class="qualifiers__title">
                    QUALIFIERS
                </div>
                <div
                    v-if="page === 'mappool'"
                    class="qualifiers__button_group"
                >
                    <div class="qualifiers__button">
                        <div class="qualifiers__button_text">
                            SHEETS
                        </div>
                        <img 
                            class="qualifiers__button_ico" 
                            src="../../Assets/img/site/open/sheets-ico.svg"
                        >
                    </div>
                    <div 
                        v-if="page === 'mappool'"
                        class="qualifiers__button"
                    >
                        <div class="qualifiers__button_text">
                            MAPPOOL
                        </div>
                        <img 
                            class="qualifiers__button_ico"
                            src="../../Assets/img/site/open/dl-ico.svg"
                        >
                    </div>
                </div>
            </div>
            <hr class="line--red line--bottom-space">
            <hr class="line--red line--bottom-space">
            <MappoolView v-if="page === 'mappool'" />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

import OpenButton from "../../Assets/components/open/OpenButton.vue";
import MappoolView from "../../Assets/components/open/MappoolView.vue";

@Component({
    components: {
        OpenButton,
        MappoolView,
    },
    head () {
        return {
            title: "Corsace Open",
        };
    },
})
export default class Qualifiers extends Vue {

    page: "mappool" | "qualifiers" | "scores" = "mappool";

    async mounted () {
        await this.$store.dispatch("setInitialData", "open");
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.qualifiers {
    background: linear-gradient(180deg, #1F1F1F 0%, #131313 100%);
    overflow: auto;

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
        width: 65vw;
        height: 100%;
        padding: 35px;
        background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
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
}
</style>