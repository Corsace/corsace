<template>
    <div class="qualifiers_view">
        <div
            v-for="qualifierGroupedByDate in qualifiersGroupedByDate"
            :key="qualifierGroupedByDate.date.getTime()"
            class="qualifiers_view_day"
        >
            <div class="qualifiers_views_day__date">
                <div class="qualifiers_view_day__date_text">
                    {{ qualifierGroupedByDate.date.toLocaleString('en-US', { month: 'long', day: 'numeric' }) }}
                </div>
            </div>
            <hr class="line--even-space line--red">
            <NuxtLink
                v-for="qualifier in qualifierGroupedByDate.qualifiers" 
                :key="qualifier.ID"
                :to="`/qualifier/${qualifier.ID}`"
                class="qualifiers_view_day__team"
            >
                <div class="qualifiers_view_day__team_name">
                    <img 
                        :src="qualifier.team?.avatarURL || require('../../img/site/open/team/default.png')"
                    >
                    <div>{{ qualifier.team?.name || "NO TEAM" }}</div>
                </div>
                <div class="qualifiers_view_day__team_time">
                    <div class="qualifiers_view_day__team_time__element">
                        {{ qualifier.date.getUTCHours() }}:{{ qualifier.date.getUTCMinutes() < 10 ? `0${qualifier.date.getUTCMinutes()}` : qualifier.date.getUTCMinutes() }} UTC
                    </div>
                    <div class="qualifiers_view_day__team_time__button">
                        <!-- <ContentButton 
                            class="content_button content_button--disabled"
                            @click.native="togglePopup()"
                        >
                            JOIN
                        </ContentButton> -->
                    </div>
                </div>
            </NuxtLink>
        </div>
        <BaseModal
            v-if="isOpen"
            @click.native="togglePopup()"
        >
            <span>You cannot create/join a qualifier until you have X players!</span>
            <span>Press anywhere to close</span>
        </BaseModal>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import { namespace } from "vuex-class";

import { Mappool } from "../../../Interfaces/mappool";
import { BaseQualifier } from "../../../Interfaces/qualifier";
import { Tournament } from "../../../Interfaces/tournament";

import BaseModal from "../BaseModal.vue";
import ContentButton from "./ContentButton.vue";

const openModule = namespace("open");

@Component({
    components: {
        ContentButton,
        BaseModal,
    },
})
export default class QualifiersView extends Vue {
    @openModule.State tournament!: Tournament | null;
    @openModule.State qualifierList!: BaseQualifier[] | null;

    @PropSync("pool", { default: null }) readonly poolData!: Mappool | null;

    isOpen = false;

    togglePopup () {
        this.isOpen = !this.isOpen;
    }

    async mounted () {
        await this.$store.dispatch("open/setQualifierList", this.tournament?.ID);
    }
    
    get qualifiersGroupedByDate (): { date: Date, qualifiers: BaseQualifier[] }[] {
        if (!this.qualifierList) return [];
        const qualifiersGroupedByDate: { date: Date, qualifiers: BaseQualifier[] }[] = [];
        for (const qualifier of this.qualifierList) {
            const date = new Date(qualifier.date);
            const qualifiersGroupedByDateIndex = qualifiersGroupedByDate.findIndex((qualifiersGroupedByDate) => qualifiersGroupedByDate.date.getDate() === date.getDate() && qualifiersGroupedByDate.date.getMonth() === date.getMonth() && qualifiersGroupedByDate.date.getFullYear() === date.getFullYear());
            if (qualifiersGroupedByDateIndex === -1) {
                qualifiersGroupedByDate.push({
                    date,
                    qualifiers: [qualifier],
                });
            } else {
                qualifiersGroupedByDate[qualifiersGroupedByDateIndex].qualifiers.push(qualifier);
                qualifiersGroupedByDate[qualifiersGroupedByDateIndex].qualifiers.sort((a, b) => a.date.getTime() - b.date.getTime());
            }
        }
        return qualifiersGroupedByDate.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.qualifiers_view {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;

        &_day {
        display: flex;
        flex-direction: column;
        width: 100%;
        padding: 10px 15px 10px 15px;
        background-image: url('../../img/site/open/checkers-bg.png'), linear-gradient(0deg, #0F0F0F -32.92%, #2F2F2F 84.43%);
        background-repeat: no-repeat;
        background-position: bottom 0px right 0px;
        box-shadow: 0px 4px 4px 0px #00000040;
        margin-bottom: 20px;

        &__date {
            display: flex;
            flex-direction: row;
            justify-content: space-between;

            &_text {
                display: flex;
                align-items: center;
                font-family: $font-ggsans;
                font-weight: 500;
                font-size: $font-xl;
                font-style: bold;
                vertical-align: middle;
            }
        }

        &__team {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            margin-bottom: 10px;

            &:hover {
                text-decoration: none;
            }

            &_name {
                display: flex;
                align-items: center;

                & img {
                    height: 2rem;
                    width: 6rem;
                    object-fit: cover;
                }

                & div {
                    font-family: $font-ggsans;
                    font-weight: 500;
                    font-size: $font-lg;
                    display: flex;
                    align-items: center;
                    vertical-align: middle;
                    margin-left: 50px;
                }
            }

            &_time {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;

                &__element {
                    font-family: $font-ggsans;
                    font-weight: 500;
                    font-size: $font-lg;
                    display: flex;
                    align-items: center;
                    vertical-align: middle;
                    height: 3.5rem;
                }

                &__button {
                    height: 3.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 5rem;
                    margin-left: 25px;
                }
            }
        }
    }
}
</style>