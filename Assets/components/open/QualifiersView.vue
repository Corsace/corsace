<template>
    <div class="qualifiers_view">
        <div
            v-for="qualifierGroupedByDate in qualifiersGroupedByDate"
            :key="qualifierGroupedByDate.date.getTime()"
            class="qualifiers_view_day"
        >
            <div class="qualifiers_view_day__date">
                <div class="qualifiers_view_day__date_text">
                    {{ qualifierGroupedByDate.date.toLocaleString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }) }}
                </div>
            </div>
            <NuxtLink
                v-for="qualifier in qualifierGroupedByDate.qualifiers" 
                :key="qualifier.ID"
                :to="`/qualifier/${qualifier.ID}`"
                class="qualifiers_view_day__qualifier"
            >
                <div class="qualifiers_view_day__team">
                    <OpenMatchupTime
                        class="qualifiers_view_day__time"
                        :date="qualifier.date"
                        timezone="UTC"
                    />
                    <div
                        v-if="qualifier.team" 
                        class="qualifiers_view_day__team_info"
                    >
                        <div
                            class="qualifiers_view_day__team_avatar" 
                            :style="{ 'backgroundImage': `url(${qualifier.team.avatarURL || require('../../img/site/open/team/default.png')})` }"
                        />
                        <div class="qualifiers_view_day__team_name">
                            {{ qualifier.team?.name || "NO TEAM" }}
                        </div>
                        <div class="qualifiers_view_day__team_members">
                            <div
                                v-for="member in qualifier.team.members"
                                :key="member.ID"
                                class="qualifiers_view_day__team_member"
                            >
                                <div
                                    v-if="member.isCaptain"
                                    class="qualifiers_view_day__team_member--leader"
                                />
                                {{ member.username }}
                                <div class="qualifiers_view_day__team_member--rank">
                                    #{{ Math.round(member.rank) }}
                                </div>
                            </div>
                        </div>
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
import OpenMatchupTime from "./OpenMatchupTime.vue";

const openModule = namespace("open");

@Component({
    components: {
        BaseModal,
        OpenMatchupTime,
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
            const qualifiersGroupedByDateIndex = qualifiersGroupedByDate.findIndex((qualifiersGroupedByDate) => qualifiersGroupedByDate.date.getUTCDate() === date.getUTCDate() && qualifiersGroupedByDate.date.getUTCMonth() === date.getUTCMonth() && qualifiersGroupedByDate.date.getUTCFullYear() === date.getUTCFullYear());
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
    gap: 22px;

    &_day {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 22px;

        &__date {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            background: $open-red;
            padding: 6px 20px;

            &_text {
                display: flex;
                align-items: center;
                font-family: $font-zurich;
                font-weight: bold;
                font-style: italic;
                font-size: $font-xxxl;
                color: $open-dark;
                vertical-align: middle;
                text-transform: uppercase;
            }
        }

        &__qualifier {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            height: 75px;

            &:hover {
                text-decoration: none;
            }
        }

        &__time {
            padding: 18px;
        }

        &__team {
            display: flex;
            align-items: center;
            width: 100%;

            font-family: $font-univers;
            font-weight: bold;
            font-size: $font-xxl;

            &_info {
                height: 100%;
                width: 60%;
                display: flex;
                flex-direction: row;
                align-items: center;
                position: relative;
            }

            &_avatar {
                width: 225px;
                height: 100%;
                background-repeat: no-repeat;
                background-position: center;
                background-size: cover;
            }

            &_name {
                width: calc(100% - 225px);
                height: 100%;
                background: linear-gradient(to right, $open-red 0%, #BB4D62 19%,transparent 100%);
                display: flex;
                align-items: center;
                padding-left: 43px;
            }

            &_members {
                position: absolute;
                width: 100%;
                height: 100%;
                background: linear-gradient(to right, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.9) 80%, transparent 100%);
                color: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-content: flex-start;
                flex-wrap: wrap;
                row-gap: 7px;
                column-gap: 50px;
                padding-left: 20px;
                opacity: 0;
                z-index: 1;

                &:hover {
                    opacity: 1;
                }
            }

            &_member {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: $font-sm;
                font-weight: normal;
                width: 130px;
                position: relative;

                &--leader {
                    position: absolute;
                    left: -15px;
                    width: 10px;
                    height: 10px;
                    background: url('../../img/site/open/team/captain.svg') no-repeat;
                    background-size: contain;
                }

                &--rank {
                    font-weight: bold;
                    color: $open-red;
                }
            }
        }
    }
}
</style>