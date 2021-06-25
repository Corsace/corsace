<template>
    <div class="staff-page">
        <mode-switcher
            :hide-phase="true"
            title="nominations"
        >
            <search-bar
                class="category-filters"
                :placeholder="$t('mca.nom_vote.search')"
                @update:search="text = $event"
            >
            </search-bar>
            <div class="staff-container staff-searchContainer">
                <div class="staff-container staff-scrollTrack">
                    <div
                        v-for="category in relatedCategories"
                        :key="category.id + '-category'"
                        class="staff-container__box"
                    >
                        <a
                            class="staff-container__title"
                            href="#"
                            @click.prevent="selectCategory(category.id)"
                        >
                            {{ category.name }}
                        </a>

                        <template v-if="category.id === selectedCategoryId">
                            <div
                                v-for="userVotes in selectedCategoryInfo"
                                :key="userVotes.voter.osuID + '-voter'"
                                class="staff-vote-container"
                            >
                                <a
                                    :href="`https://osu.ppy.sh/users/${userVotes.voter.osuID}`"
                                    target="_blank"
                                    class="staff-page__link"
                                >
                                    {{ userVotes.voter.osuUsername }}
                                </a>

                                <ul>
                                    <li
                                        v-for="vote in userVotes.votes"
                                        :key="vote.ID + '-voter'"
                                    >
                                        <div class="staff-vote">
                                            <div class="staff-vote__info">
                                                <a
                                                    class="staff-page__link"
                                                    :href="generateUrl(vote)"
                                                    target="_blank"
                                                >
                                                    {{ getVoteName(vote) }}
                                                </a>
                                            </div>
                                            <div class="staff-vote__choice">
                                                Choice: {{ vote.choice }}
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </template>
                    </div>
                </div>
                <scroll-bar selector=".staff-scrollTrack" />
            </div>
        </mode-switcher>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace, State } from "vuex-class";

import ModeSwitcher from "../../../../MCA-AYIM/components/ModeSwitcher.vue";
import ScrollBar from "../../../../MCA-AYIM/components/ScrollBar.vue";
import SearchBar from "../../../../MCA-AYIM/components/SearchBar.vue";
import ToggleButton from "../../../../MCA-AYIM/components/ToggleButton.vue";

import { CategoryInfo } from "../../../../Interfaces/category";
import { StaffVote } from "../../../../Interfaces/vote";

const staffModule = namespace("staff");

interface UserVote {
    voter: {
        osuID: string;
        osuUsername: string;
        discordUsername: string;
    },
    votes: StaffVote[]
}

interface VotesByCategory {
    category: number;
    userVotes: UserVote[];
}

@Component({
    components: {
        ModeSwitcher,
        ScrollBar,
        SearchBar,
        ToggleButton,
    },
    head () {
        return {
            title: "Votes | Staff | MCA",
        };
    },
})
export default class Votes extends Vue {
    
    @State selectedMode!: string;
    @staffModule.State categories!: CategoryInfo[];

    votes: StaffVote[] = [];
    text = "";
    selectedCategoryId: null | number = null;

    get relatedCategories (): CategoryInfo[] {
        return this.categories.filter(c => c.mode === this.selectedMode);
    }

    get votesByCategory (): VotesByCategory[] {
        let groups: VotesByCategory[] = [];

        for (const vote of this.votes) {
            if (this.text) {
                const lowerText = this.text.toLowerCase();
                if (vote.user?.osuID) {
                    if (
                        !vote.voter.osuUsername.toLowerCase().includes(lowerText) &&
                        !vote.voter.osuID.includes(lowerText) &&
                        !vote.voter.discordUsername.includes(lowerText) &&
                        !vote.user.osuUsername.toLowerCase().includes(lowerText) && 
                        !vote.user.osuID.includes(lowerText) &&
                        !vote.user.discordUsername.toLowerCase().includes(lowerText)
                    )
                        continue;
                } else if (vote.beatmapset?.ID) {
                    if (
                        !vote.voter.osuUsername.toLowerCase().includes(lowerText) &&
                        !vote.voter.osuID.includes(lowerText) &&
                        !vote.voter.discordUsername.includes(lowerText) &&
                        !vote.beatmapset.ID.toString().includes(lowerText) &&
                        !vote.beatmapset.artist.toLowerCase().includes(lowerText) &&
                        !vote.beatmapset.title.toLowerCase().includes(lowerText) &&
                        !vote.beatmapset.tags.toLowerCase().includes(lowerText) &&
                        !vote.beatmapset.creator!.osuUsername.toLowerCase().includes(lowerText) && 
                        !vote.beatmapset.creator!.osuID.includes(lowerText) &&
                        !vote.beatmapset.creator!.discordUsername.toLowerCase().includes(lowerText)
                    )
                        continue;
                }
            }

            const groupIndex = groups.findIndex(g => g.category === vote.category);

            if (groupIndex !== -1) {
                const voterIndex = groups[groupIndex].userVotes.findIndex(v => v.voter.osuID === vote.voter.osuID);

                if (voterIndex !== -1) {
                    groups[groupIndex].userVotes[voterIndex].votes.push(vote);
                } else {
                    groups[groupIndex].userVotes.push({
                        voter: vote.voter,
                        votes: [vote],
                    });
                }
            } else {
                groups.push({
                    category: vote.category,
                    userVotes: [{
                        voter: vote.voter,
                        votes: [vote],
                    }],
                });
            }
        }

        groups = groups.map(group => {
            group.userVotes = group.userVotes.map(userVote => {
                userVote.votes = userVote.votes.sort((a, b) => a.choice - b.choice);
                return userVote;
            });

            return group;
        });

        return groups;
    }

    get selectedCategoryInfo (): UserVote[] {
        const group = this.votesByCategory.find(group => group.category === this.selectedCategoryId);
        return group?.userVotes || [];
    }

    async selectCategory (id: number) {
        const { data } = await this.$axios.get(`/api/staff/votes?category=${id}`);

        if (data.error) {
            alert(data.error);
            return;
        }

        this.votes = data;
        this.selectedCategoryId = id;
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

.staff-vote {
    &-container {
        display: flex;
        flex-direction: column;
        margin-bottom: 10px;
        border-bottom: 1px solid white;
    }
    
    display: flex;
    align-items: center;
    justify-content: space-between;

    min-height: 65px;

    border-bottom: 1px solid white;

    &__status {
        margin-left: 5px;

        &--valid {
            color: $green;
        }

        &--invalid {
            color: $red;
        }
    }

    &__choice {
        margin-right: 20px;
    }

    &__action {
        margin: 5px;
    }
}

</style>
