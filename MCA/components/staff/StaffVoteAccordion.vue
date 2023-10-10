<template>
    <div class="staff-accordion-body">
        <!-- results view -->
        <template v-if="viewOption === 'results' && resultVotes">
            <div class="staff-accordion-section">
                <ul class="staff-list">
                    <li
                        v-for="result in resultVotes"
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
                                    4th+ Choices: {{ count4thChoices(result.placeCounts) }}
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </template>

        <!-- voter view -->
        <template v-else-if="viewOption === 'voters' && userVotes">
            <div
                v-for="userVote in userVotes"
                :key="userVote.voter.osuID + '-voter'"
                class="staff-accordion-section"
            >
                <user-avatar
                    :avatar-location="'left'"
                    :user-id="userVote.voter.osuID"
                    :username="userVote.voter.osuUsername"
                    class="staff-accordion-section__heading"
                />
                <ul class="staff-list">
                    <li
                        v-for="vote in userVote.votes"
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
                                        @click="$emit('remove-vote', vote.ID, userVote.voter.ID)"
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
import UserAvatar from "./UserAvatar.vue";

@Component({
    components: {
        UserAvatar,
    },
})
export default class StaffVoteAccordion extends Vue {
    @Prop({ type: String, default: "results" }) viewOption!: string;
    @Prop({ type: Array, default: {} }) data!: ResultVote[] | UserVote[];

    get resultVotes () {
        if (this.data.length === 0 || !("placement" in this.data[0]))
            return undefined;

        return this.data as ResultVote[];
    }

    get userVotes () {
        if (this.data.length === 0 || "placement" in this.data[0])
            return undefined;

        return this.data as UserVote[];
    }

    getBanner (vote: ResultVote) {
        if (vote.beatmapset)
            return { "background-image": `url('https://assets.ppy.sh/beatmaps/${vote.beatmapset.ID}/covers/cover.jpg?1560315422')` };
        
        if (vote.user)
            return { "background-image": `url(https://a.ppy.sh/${vote.user.osuID})` };

        return { "background-image": "" };
    }

    generateUrl (vote: StaffVote): string {
        if (vote.beatmap) 
            return `https://osu.ppy.sh/beatmaps/${vote.beatmap.ID}`;
        
        if (vote.beatmapset)
            return `https://osu.ppy.sh/beatmapsets/${vote.beatmapset.ID}`;
        
        return `https://osu.ppy.sh/users/${vote.user?.osuID}`;
    }

    getVoteName (vote: StaffVote) {
        if (vote.beatmapset) {
            if (vote.beatmap)
                return `${vote.beatmapset.artist} - ${vote.beatmapset.title} by ${vote.beatmapset.creator.osuUsername} [${vote.beatmap.difficulty}]`;
            else
                return `${vote.beatmapset.artist} - ${vote.beatmapset.title} by ${vote.beatmapset.creator.osuUsername}`;
        }

        return `${vote.user?.osuUsername}`;
    }

    count4thChoices (placeCounts: Record<number, number>) {
        let res = 0;
        const keys = Object.keys(placeCounts).map(k => parseInt(k));
        keys.filter(k => k > 3).forEach(k => res += placeCounts[k]);
        return res;
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
