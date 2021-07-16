<template>
    <div class="staff-page">
        <mode-switcher
            hide-phase
            title="voting"
        >
            <div class="staff-filters">
                <search-bar
                    v-if="viewOption==='voters'"
                    class="category-filters"
                    :placeholder="$t('mca.nom_vote.search')"
                    @update:search="text = $event"
                >
                    <toggle-button
                        :options="['voters', 'results']"
                        @change="changeView"
                    />
                </search-bar>
                <toggle-button
                    v-else
                    :options="['results', 'voters']"
                    @change="changeView"
                />
            </div>
            <div class="staff-container staff-searchContainer">
                <div class="staff-container staff-scrollTrack">
                    <template
                        v-for="category in relatedCategories"
                    >
                        <div
                            :key="category.id + '-cat-header'"
                            class="staff-container__header"
                            :class="{ 'staff-container__header--active': category.id === selectedCategoryId }"
                            @click.prevent="selectCategory(category.id)"
                        >
                            <a
                                class="staff-container__title"
                                href="#"
                                @click.prevent
                            >
                                {{ $t(`mca.categories.${category.name}.name`) }}
                            </a>
                            <span>{{ category.type }}</span>
                        </div>
                        <div
                            v-if="category.id === selectedCategoryId"
                            :key="category.id + '-category'"
                            class="staff-container__box"
                        >
                            <template v-if="viewOption === 'results'">
                                <ul class="staff-list">
                                    <li
                                        v-for="result in selectedCategoryInfo"
                                        :key="result.ID"
                                    >
                                        <div class="staff-vote">
                                            <div class="staff-vote__info">
                                                <div 
                                                    class="staff-page__banner"
                                                    :style="getBanner(result)"
                                                />
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
                                                <div>1st Choice Count: {{ result.firstPlaceCount }}</div>
                                                <div>Total Count: {{ result.totalCount }}</div>
                                                <div>Count: {{ result.count }}</div>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </template>
                            <template v-else-if="viewOption === 'voters'">
                                <div
                                    v-for="userVotes in selectedCategoryInfo"
                                    :key="userVotes.voter.osuID + '-voter'"
                                    class="staff-vote-container"
                                >
                                    <span class="staff-user">
                                        <a
                                            :href="`https://osu.ppy.sh/users/${userVotes.voter.osuID}`"
                                            target="_blank"
                                            class="staff-user__link"
                                        >
                                            {{ userVotes.voter.osuUsername }}
                                        </a>
                                        <a
                                            :href="`https://osu.ppy.sh/users/${userVotes.voter.osuID}`"
                                            target="_blank"
                                        >
                                            <img
                                                :src="`https://a.ppy.sh/${userVotes.voter.osuID}`"
                                                class="staff-user__avatar"
                                            >
                                        </a>
                                    </span>

                                    <ul class="staff-list">
                                        <li
                                            v-for="vote in userVotes.votes"
                                            :key="vote.ID + '-voter'"
                                        >
                                            <div class="staff-vote">
                                                <div class="staff-vote__info">
                                                    <div 
                                                        class="staff-page__banner"
                                                        :style="getBanner(vote)"
                                                    />
                                                    <a
                                                        class="staff-page__link"
                                                        :href="generateUrl(vote)"
                                                        target="_blank"
                                                    >
                                                        {{ getVoteName(vote) }}
                                                    </a>
                                                </div>
                                                <div class="staff-vote__actions">
                                                    Choice: {{ vote.choice }}
                                                </div>
                                                <div class="staff-vote__actions">
                                                    <button
                                                        class="button button--small staff-nomination__action"
                                                        @click="removeVote(vote.ID, userVotes.voter.ID)"
                                                    >
                                                        remove vote
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </template>
                        </div>
                    </template>
                </div>
                <scroll-bar
                    selector=".staff-scrollTrack"
                    @bottom="selectStart === -1 && 'voters' ? null : appendCategory()"
                />
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
import { ResultVote, StaffVote, UserVote, voteCounter } from "../../../../Interfaces/vote";

const staffModule = namespace("staff");

interface VotesByCategory {
    category: number;
    userVotes: UserVote[];
}

interface ResultsByCategory {
    category: number;
    results: ResultVote[];
}

type ViewOption = "results" | "voters";

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
    viewOption: ViewOption = "results";
    text = "";
    selectedCategoryId: null | number = null;
    selectStart = 0;

    get relatedCategories (): CategoryInfo[] {
        return this.categories.filter(c => c.mode === this.selectedMode || c.mode === "storyboard");
    }

    get votesByCategory (): VotesByCategory[] {
        let groups: VotesByCategory[] = [];

        for (const vote of this.votes) {
            if (this.text && this.viewOption === "voters") {
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

            const resultVote: ResultVote = {
                ...vote,
                inRace: true,
                used: false,
            } as ResultVote;

            const groupIndex = groups.findIndex(g => g.category === vote.category);

            if (groupIndex !== -1) {
                const voterIndex = groups[groupIndex].userVotes.findIndex(v => v.voter.osuID === vote.voter.osuID);

                if (voterIndex !== -1) {
                    groups[groupIndex].userVotes[voterIndex].votes.push(resultVote);
                } else {
                    groups[groupIndex].userVotes.push({
                        voter: vote.voter,
                        votes: [resultVote],
                    });
                }
            } else {
                groups.push({
                    category: vote.category,
                    userVotes: [{
                        voter: vote.voter,
                        votes: [resultVote],
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

    get resultsByCategory (): ResultsByCategory[] {
        return this.votesByCategory.map(category => {
            return {
                category: category.category,
                results: voteCounter(category.userVotes),
            };
        });
    }

    get selectedCategoryInfo (): UserVote[] | ResultVote[] {
        if (this.viewOption === "voters") {
            const group = this.votesByCategory.find(group => group.category === this.selectedCategoryId);
            return group?.userVotes || [];
        }

        const group = this.resultsByCategory.find(group => group.category === this.selectedCategoryId);
        return group?.results || [];
    }

    async selectCategory (id: number | null) {
        if (!id) return;

        if (this.selectedCategoryId === id) {
            this.votes = [];
            this.selectedCategoryId = null;
            return;
        }
        this.selectStart = 0;

        const { data } = await this.$axios.get(
            `/api/staff/votes?category=${id}${this.viewOption === "voters" ? `&start=${this.selectStart}` : ""}`
        );

        if (data.error) {
            alert(data.error);
            return;
        }

        this.votes = data.staffVotes;
        this.selectStart = this.viewOption === "voters" ? data.nextStart : -1;
        this.selectedCategoryId = id;
    }

    async appendCategory () {
        if (this.selectStart === -1) return;

        const { data } = await this.$axios.get(`/api/staff/votes?category=${this.selectedCategoryId}&start=${this.selectStart}`);
        if (data.error) {
            alert(data.error);
            return;
        }

        this.votes.push(...data.staffVotes);
        this.selectStart = data.nextStart;
    }


    async removeVote (id: number, userID: number) {
        if (!confirm("ARE YOU SURE YOU WANT TO DELETE THIS VOTE? IT'S IN CAPS FOR L'EMPHASIS."))
            return;

        try {
            const { data } = await this.$axios.delete(`/api/staff/votes/${id}/${userID}`);

            if (data.error) {
                alert(data.error);
                return;
            }

            await this.selectCategory(this.selectedCategoryId);
        } catch (e) {
            console.error(e);
            alert("LOOK AT CONSOLE AND ALERT VINXIS IMMEDIATELY!!!!!!!");
        }
    }

    async changeView (option: ViewOption) {
        this.viewOption = option;
        this.text = "";
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

    getBanner (item: ResultVote) {
        if (item.beatmapset) {
            return { "background-image": `url('https://assets.ppy.sh/beatmaps/${item.beatmapset.ID}/covers/cover.jpg?1560315422')` };
        } else if (item.user) {
            return { "background-image": `url(https://a.ppy.sh/${item.user.osuID})` };
        }
        return { "background-image": "" };
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

    min-height: 65px;

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

    &__count {
        display: flex;
        & > div {
            margin-right: 20px;
        }
    }

    &__info {
        margin-right: auto;
    }

    &__actions {
        display: flex;
        margin-left: 8px;
    }

    &__action {
        margin: 5px;
    }

    &__count {
        flex: none;
    }
}

</style>
