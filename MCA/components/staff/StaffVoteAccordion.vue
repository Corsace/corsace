<template>
    <div class="staff-accordion-body">
        <!-- results view -->
        <template v-if="viewOption === 'results'">
            <div class="staff-accordion-section">
                <ul class="staff-list">
                    <li
                        v-for="result in data"
                        :key="result.ID"
                    >
                        <div class="staff-nomVote">
                            <div
                                class="staff-page__banner"
                                :style="getBanner(result)"
                            />

                            <div class="staff-vote__info">
                                <a
                                    class="staff-page__link"
                                    :href="generateUrl(result)"
                                    target="_blank"
                                >
                                    {{ getVoteName(result) }}
                                </a>
                            </div>

                            <div class="staff-vote__count">
                                <div>Placement: {{ result.placement }}</div>
                                <div>1st Choices: {{ result.placeCounts[1] || 0 }}</div>
                                <div>2nd-3rd Choices: {{ (result.placeCounts[2] || 0) + (result.placeCounts[3] || 0) }}</div>
                                <div>
                                    4th+ Choices: {{ () => {
                                        let res = 0; 
                                        Object.keys(result.placeCounts).filter(k => parseInt(k) > 3).forEach(k => res += result.placeCounts[k]);
                                        return res;
                                    } }}
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </template>

        <!-- voter view -->
        <template v-else-if="viewOption === 'voters'">
            <div
                v-for="userVotes in data"
                :key="userVotes.voter.osuID + '-voter'"
                class="staff-accordion-section"
            >
                <user-avatar
                    :avatar-location="'left'"
                    :user-id="userVotes.voter.osuID"
                    :username="userVotes.voter.osuUsername"
                    class="staff-accordion-section__heading"
                />
                <ul class="staff-list">
                    <li
                        v-for="vote in userVotes.votes"
                        :key="vote.ID + '-voter'"
                    >
                        <div class="staff-nomVote">
                            <div
                                class="staff-page__banner"
                                :style="getBanner(vote)"
                            />

                            <div class="staff-vote__info">
                                <a
                                    class="staff-page__link"
                                    :href="generateUrl(vote)"
                                    target="_blank"
                                >
                                    {{ getVoteName(vote) }}
                                </a>
                            </div>

                            <div class="staff-list__actions">
                                <div class="staff-list__action">
                                    Choice: {{ vote.choice }}
                                </div>
                                <div class="staff-list__action">
                                    <button
                                        class="button button--small staff-list__action"
                                        @click="$emit('remove-vote', vote.ID, userVotes.voter.ID)"
                                    >
                                        remove vote
                                    </button>
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component } from "vue-property-decorator";
import { UserVote, ResultVote, StaffVote } from "../../../Interfaces/vote";
import UserAvatar from "../staff/UserAvatar.vue";

@Component({
    components: {
        UserAvatar,
    },
})
export default class StaffVoteAccordion extends Vue {
    @Prop({ type: String, default: "results" }) viewOption!: string;
    @Prop({ type: Array, default: {} }) data!: ResultVote[] | UserVote[];

    getBanner (item: ResultVote) {
        if (item.beatmapset) {
            return { "background-image": `url('https://assets.ppy.sh/beatmaps/${item.beatmapset.ID}/covers/cover.jpg?1560315422')` };
        } else if (item.user) {
            return { "background-image": `url(https://a.ppy.sh/${item.user.osuID})` };
        }
        return { "background-image": "" };
    }

    generateUrl (vote: StaffVote): string {
        if (vote.beatmapset) {
            return `https://osu.ppy.sh/beatmapsets/${vote.beatmapset.ID}`;
        }
        
        return `https://osu.ppy.sh/users/${vote.user?.osuID}`;
    }

    getVoteName (vote: StaffVote) {
        if (vote.beatmapset) {
            return `${vote.beatmapset.artist} - ${vote.beatmapset.title} by ${vote.beatmapset.creator!.osuUsername}`;
        }

        return `${vote.user?.osuUsername}`;
    }

}
</script>

<style lang="scss">
@use '@s-sass/_partials';
@import '@s-sass/_variables';

.staff-vote__count {
    display: flex;
    flex: none;

    & > div {
        margin-right: 20px;
    }
}

</style>
