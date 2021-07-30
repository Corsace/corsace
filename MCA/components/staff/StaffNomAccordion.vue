<template>
    <div class="staff-accordion-body">
        <div class="staff-accordion-section">
            <ul class="staff-list">
                <li
                    v-for="nomination in nominations"
                    :key="nomination.ID + '-nomination'"
                >
                    <div class="staff-nomVote">
                        <!-- background banner-->
                        <div
                            class="staff-page__banner"
                            :style="getBanner(nomination)"
                        />

                        <!-- text on left side -->
                        <div class="staff-nomination__info">
                            <a
                                class="staff-nomination__title"
                                :href="generateUrl(nomination)"
                                target="_blank"
                            >
                                {{ getNomineeName(nomination) }}
                            </a>
                            
                            <div>
                                <a
                                    v-if="nomination.beatmapset && nomination.beatmapset.ID"
                                    class="staff-page__small"
                                >
                                    {{ getSpecs(nomination) }}
                                </a>
                                <span
                                    class="staff-nomVote__status"
                                    :class="`staff-nomVote__status--${nomination.isValid ? 'valid' : 'invalid'}`"
                                >
                                    {{ nomination.isValid ? 'valid' : 'invalid' }}
                                </span>
                            </div>

                            <div
                                v-if="nomination.reviewer"
                                class="staff-page__small"
                            >
                                Last reviewed by:
                                {{ nomination.reviewer }}
                                on {{ new Date(nomination.lastReviewedAt).toString() }}
                            </div>

                            <div class="staff-user__list">
                                <user-avatar 
                                    v-for="nominator in nomination.nominators"
                                    :key="nominator.osuID + '-nominator'"
                                    :avatar-location="'left'"
                                    :user-id="nominator.osuID"
                                    :username="nominator.osuUsername"
                                    small
                                />
                            </div>
                        </div>

                        <!-- buttons on right side -->
                        <div class="staff-list__actions">
                            <button
                                v-if="nomination.isValid"
                                class="button button--small staff-list__action"
                                @click="$emit('update-nomination', nomination.ID, true)"
                            >
                                accept
                            </button>
                            <button
                                class="button button--small staff-list__action"
                                @click="$emit('update-nomination', nomination.ID, false)"
                            >
                                reject
                            </button>
                            <button
                                class="button button--small staff-list__action"
                                @click="$emit('delete-nomination', nomination.ID)"
                            >
                                delete
                            </button>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component } from "vue-property-decorator";
import UserAvatar from "../staff/UserAvatar.vue";
import { StaffNomination } from "../../../Interfaces/nomination";

@Component({
    components: {
        UserAvatar,
    },
})
export default class StaffNominationAccordion extends Vue {
    @Prop({ type: Array, default: {} }) nominations!: StaffNomination[];

    getBanner (nomination: StaffNomination) {
        if (nomination.beatmapset) {
            return { "background-image": `url('https://assets.ppy.sh/beatmaps/${nomination.beatmapset.ID}/covers/cover.jpg?1560315422')` };
        } else if (nomination.user) {
            return { "background-image": `url(https://a.ppy.sh/${nomination.user.osuID})` };
        }
        return { "background-image": "" };
    }

    generateUrl (nomination: StaffNomination): string {
        if (nomination.beatmapset) {
            return `https://osu.ppy.sh/beatmapsets/${nomination.beatmapset.ID}`;
        }
        
        return `https://osu.ppy.sh/users/${nomination.user?.osuID}`;
    }

    getNomineeName (nomination: StaffNomination) {
        if (nomination.beatmapset) {
            return `${nomination.beatmapset.artist} - ${nomination.beatmapset.title} by ${nomination.beatmapset.creator!.osuUsername}`;
        }

        return `${nomination.user?.osuUsername}`;
    }

    getSpecs (nomination: StaffNomination): string {
        if (!nomination.beatmapset) return "";
        
        const minutes = Math.floor(nomination.beatmapset.length / 60);
        const seconds = nomination.beatmapset.length - minutes * 60;
        let time = `${minutes}:${seconds}`;
        if (time.slice(-2, -1) === ":") {
            time =  time.slice(0, -1) + "0" + time.slice(-1);
        }
        return `${nomination.beatmapset.BPM} BPM | ${time} | ${nomination.beatmapset.maxSR.toFixed(2)} ★`;
    }
}
</script>

<style lang="scss">
@use '@s-sass/_partials';
@import '@s-sass/_variables';

.staff-nomination__title {
    font-size: 1.1rem;
    font-weight: 500;
}
</style>