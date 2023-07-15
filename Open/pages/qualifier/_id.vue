<template>
    <div class="qualifier_id">
        <div class="qualifier_id__main_content">
            <OpenTitle>
                QUALIFIERS
                <template #buttons>
                    <ContentButton 
                        class="content_button--header_button content_button--disabled"
                        @click.native="togglePopup()"
                    >
                        JOIN
                    </ContentButton>
                    <BaseModal
                        v-if="isOpen"
                        @click.native="togglePopup()"
                    >
                        <span>You cannot create/join a qualifier until you have {{ tournament?.minTeamSize === tournament?.maxTeamSize ? tournament?.minTeamSize : tournament?.minTeamSize + " to " + tournament?.maxTeamSize }} players!</span>
                        <span>Press anywhere to close</span>
                    </BaseModal>
                </template>
            </OpenTitle>
            <div class="qualifier_id__info_bar">
                <div class="qualifier_id__info_bar_group">
                    <div class="qualifier_id__info_bar_group__title">
                        REFEREES: 
                    </div>
                    <div class="qualifier_id__info_bar_group__data">
                        RISEN
                    </div>
                </div>
                <div class="qualifier_id__info_bar_group">
                    <div class="qualifier_id__info_bar_group__title">
                        TEAM: 
                    </div>
                    <div class="qualifier_id__info_bar_group__data">
                        LEAGUE OF LEGEND
                    </div>
                </div>
                <div class="qualifier_id__info_bar_time qualifier_id__info_bar_group__title">
                    AUG 11 22:00 UTC
                </div>
            </div>
            <div class="qualifier_id__switch">
                <div 
                    class="qualifier_id__switch_item"
                    :class="{ 'qualifier_id__switch_item--active': page === 'teams' }"
                    @click="page = 'teams'"
                >
                    TEAMS
                </div>
                <div 
                    class="qualifier_id__switch_item"
                    :class="{ 'qualifier_id__switch_item--active': page === 'players' }"
                    @click="page = 'players'"
                >
                    PLAYERS
                </div>
            </div>
            <ScoresView
                v-if="page === 'teams'"
                class="qualifier_id__scores"
            />
            <ScoresView
                v-if="page === 'players'"
                class="qualifier_id__scores"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

import ContentButton from "../../Assets/components/open/ContentButton.vue";
import ScoresView from "../../Assets/components/open/ScoresView.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import BaseModal from "../../Assets/components/BaseModal.vue";

@Component({
    components: {
        ContentButton,
        ScoresView,
        OpenTitle,
        BaseModal,
    },
    head () {
        return {
            title: "Corsace Open",
        };
    },
})
export default class Qualifier extends Vue {

    page: "teams" | "players"  = "teams";

    isOpen = false;
    togglePopup () {
        this.isOpen = !this.isOpen;
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.qualifier_id {
    background: linear-gradient(180deg, #1F1F1F 0%, #131313 100%);

    &__main_content {
        align-self: center;
        position: relative;
        width: 65vw;
        padding: 35px;
        background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);
    }

    &__info_bar {
        margin-top: 20px;
        padding: 5px 10px 5px 10px;
        background: $open-dark;
        width: 100%;
        display: flex;
        flex-direction: row;

        &_group{
            display: flex;
            margin-right: 25px;
            &__title {
                font-family: $font-ggsans;
                font-weight: 700;
                font-size: $font-xl;
                margin-right: 0.5rem;
            }

            &__data {
                font-family: $font-ggsans;
                font-weight: 700;
                font-size: $font-xl;
                color: $open-red
            }
        }

        &_time {
            flex-grow: 1;
            text-align: right;
        }
    }

    &__switch {
        display: flex;
        justify-content: center;
        cursor: pointer;

        &_item {
            color: $gray;
            background-color: $open-dark;
            margin: 20px 0px 20px 0px;
            padding: 10px 35px 10px 35px;

            &--active {
                color: $open-red;
            }
        }
    }
    
    &__scores {
        height: 95%;
        overflow: hidden;
    }
}
</style>