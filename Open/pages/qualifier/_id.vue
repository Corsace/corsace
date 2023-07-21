<template>
    <div class="qualifier">
        <div 
            v-if="qualifierData"
            class="qualifier__wrapper"
        >
            <div class="qualifier__main_content">
                <OpenTitle>
                    QUALIFIERS
                    <template #buttons>
                        <!-- <ContentButton 
                            class="content_button--header_button content_button--disabled"
                            @click.native="togglePopup()"
                        >
                            JOIN
                        </ContentButton> -->
                        <BaseModal
                            v-if="isOpen"
                            @click.native="togglePopup()"
                        >
                            <span>You cannot create/join a qualifier until you have {{ tournament?.minTeamSize === tournament?.maxTeamSize ? tournament?.minTeamSize : tournament?.minTeamSize + " to " + tournament?.maxTeamSize }} players!</span>
                            <span>Press anywhere to close</span>
                        </BaseModal>
                    </template>
                </OpenTitle>
                <div class="qualifier__info_bar">
                    <div class="qualifier__info_bar_group">
                        <div class="qualifier__info_bar_group__title">
                            REFEREES: 
                        </div>
                        <div class="qualifier__info_bar_group__data">
                            {{ qualifierData.referee?.username || "N/A" }}
                        </div>
                    </div>
                    <div class="qualifier__info_bar_group">
                        <div class="qualifier__info_bar_group__title">
                            TEAM: 
                        </div>
                        <NuxtLink
                            class="qualifier__info_bar_group__data"
                            :to="`/team/${qualifierData.team?.ID}`"
                        >
                            {{ qualifierData.team?.name || "N/A" }}
                        </NuxtLink>
                    </div>
                    <div class="qualifier__info_bar_time qualifier__info_bar_group__title">
                        {{ qualifierData.date.toLocaleString('en-US', optionsUTC) }} ({{ qualifierData.date.toLocaleString('en-US', options) }})
                    </div>
                </div>
                <div class="qualifier__switch">
                    <ContentButton 
                        class="content_button--header_button content_button--red_sm"
                        :class="{
                            'content_button--red': scoreView === 'players',
                            'content_button--red_outline': scoreView !== 'players',
                        }"
                        @click.native="scoreView = 'players'"
                    >
                        {{ $t('open.qualifiers.scores.players') }}
                    </ContentButton>
                    <ContentButton 
                        class="content_button--header_button content_button--red_sm"
                        :class="{
                            'content_button--red': scoreView === 'teams',
                            'content_button--red_outline': scoreView !== 'teams',
                        }"
                        @click.native="scoreView = 'teams'"
                    >
                        {{ $t('open.qualifiers.scores.teams') }}
                    </ContentButton>
                </div>
                <ScoresView
                    :view="scoreView"
                />
            </div>
        </div>
        <div 
            v-else-if="loading"
            class="qualifier__wrapper"
        >
            <div class="qualifier__main_content">
                <OpenTitle>
                    LOADING...
                </OpenTitle>
            </div>
        </div>
        <div 
            v-else
            class="qualifier__wrapper"
        >
            <div class="qualifier__main_content">
                <OpenTitle>
                    NO QUALIFIER FOUND
                </OpenTitle>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";

import { Qualifier as QualifierInterface } from "../../../Interfaces/qualifier";
import { Tournament } from "../../../Interfaces/tournament";
import { Team } from "../../../Interfaces/team";

import ContentButton from "../../Assets/components/open/ContentButton.vue";
import ScoresView from "../../Assets/components/open/ScoresView.vue";
import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import BaseModal from "../../Assets/components/BaseModal.vue";

const openModule = namespace("open");

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
    validate ({ params }) {
        return !params.id || !isNaN(parseInt(params.id));
    },
})
export default class Qualifier extends Vue {

    scoreView: "teams" | "players"  = "teams";

    @openModule.State tournament!: Tournament | null;
    @openModule.State team!: Team | null;

    loading = false;
    qualifierData: QualifierInterface | null = null;

    optionsUTC: Intl.DateTimeFormatOptions = {
        month: "long", // Full month name (e.g., "July")
        day: "numeric", // Day of the month (e.g., "30")
        hour: "2-digit", // Two-digit hour (e.g., "23")
        minute: "2-digit", // Two-digit minute (e.g., "59")
        timeZone: "UTC", // Set the time zone to UTC
        timeZoneName: "short", // Abbreviated time zone name (e.g., "UTC")
    };
    options: Intl.DateTimeFormatOptions = {
        month: "long", // Full month name (e.g., "July")
        day: "numeric", // Day of the month (e.g., "30")
        hour: "2-digit", // Two-digit hour (e.g., "23")
        minute: "2-digit", // Two-digit minute (e.g., "59")
        timeZoneName: "short", // Abbreviated time zone name (e.g., "UTC")
    };

    async getQualifier (): Promise<QualifierInterface | null> {
        this.loading = true;
        let ID = 0;
        if (!this.$route.params.id) {
            if (!this.team?.qualifier?.ID) {
                this.loading = false;
                return null;
            }
            
            ID = this.team.qualifier.ID;
        } else
            ID = parseInt(this.$route.params.id);

        const { data: qualifierData } = await this.$axios.get(`/api/qualifier/${ID}`);
        this.loading = false;
        return qualifierData.error ? null : qualifierData;
    }

    async mounted () {
        this.qualifierData = await this.getQualifier();
        if (this.qualifierData) {
            this.$store.commit("open/setQualifierScores", this.qualifierData.scores);
            this.qualifierData.date = new Date(this.qualifierData.date);
        }
    }

    isOpen = false;
    togglePopup () {
        this.isOpen = !this.isOpen;
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.qualifier {
    &__wrapper {
        background: linear-gradient(180deg, #1F1F1F 0%, #131313 100%);
        display: flex;
        justify-content: center;
        height: 100%;
    }

    &__main_content {
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

        &_group {
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
                color: $open-red;

                &:hover {
                    text-decoration: none;
                }
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
        overflow: hidden;
    }
}
</style>