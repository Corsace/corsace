<template>
    <div class="staff-page">
        <mode-switcher
            :hide-phase="true"
            title="voting"
        >
            <search-bar
                v-if="viewOption==='voters'"
                class="category-filters"
                :placeholder="$t('mca.nom_vote.search')"
                @update:search="text = $event"
            />
            <toggle-button
                :options="viewOptions"
                @change="changeView"
            />
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

                        <template v-if="category.id === selectedCategoryId && viewOption === 'results'">
                            <ul>
                                <li
                                    v-for="result in selectedCategoryInfo"
                                    :key="result.ID"
                                >
                                    <div class="staff-vote">
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
                                            <div
                                                v-for="(round, i) in result.rounds"
                                                :key="i" 
                                            >
                                                Round #{{i}}: {{ round }}
                                            </div>
                                            <div>
                                                Count: {{ result.count }}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </template>
                        <template v-else-if="category.id === selectedCategoryId && viewOption === 'voters'">
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

interface ResultVote extends StaffVote {
    used: boolean;
    inRace: boolean;
    count: number;
    rounds: number[];
}

interface UserVote {
    voter: {
        osuID: string;
        osuUsername: string;
        discordUsername: string;
    },
    votes: ResultVote[]
}

interface VotesByCategory {
    category: number;
    userVotes: UserVote[];
}

interface ResultsByCategory {
    category: number;
    results: ResultVote[];
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
    viewOptions = ["results", "voters"];
    viewOption = "results";
    text = "";
    selectedCategoryId: null | number = null;

    get relatedCategories (): CategoryInfo[] {
        return this.categories.filter(c => c.mode === this.selectedMode);
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
            const votes = category.userVotes
            let candidates: ResultVote[] = [];
            for (const voter of votes) {
                for (const vote of voter.votes) {
                    if (!candidates.some(candidate => vote.beatmapset?.ID ? vote.beatmapset?.ID === candidate.beatmapset?.ID : vote.user?.osuID === candidate.user?.osuID)) {
                        candidates.push({
                            rounds: [] as number[],
                            count: 0,
                            inRace: true,
                            beatmapset: vote.beatmapset ?? undefined,
                            user: vote.user ?? undefined,
                        } as ResultVote);
                    }
                }
            }
            candidates = candidates.filter((val, i, self) => self.findIndex(v => v.beatmapset?.ID ? v.beatmapset?.ID === val.beatmapset?.ID : v.user?.osuID === val.user?.osuID) === i);

            for (;;) {
                for (let i = 0; i < votes.length; i++) {
                    const voter = votes[i];
                    for (let j = 0; j < voter.votes.length; j++) {
                        const vote = voter.votes[j];
                        if (!vote.inRace) continue;

                        const k = candidates.findIndex(candidate => vote.beatmapset?.ID ? vote.beatmapset?.ID === candidate.beatmapset?.ID : vote.user?.osuID === candidate.user?.osuID);
                        if (!candidates[k].inRace) {
                            votes[i].votes[j].inRace = false;
                            continue;
                        }
                        if (vote.used)
                            break;

                        candidates[k].count += 1;
                        votes[i].votes[j].used = true;
                        break;
                    }
                }
                candidates = candidates.sort((a, b) => b.count - a.count);
                if (candidates[candidates.length - 1].inRace && candidates[candidates.length - 1].count === 0) {
                    for (let i = candidates.length - 1; i > 0; i--) {
                        if (candidates[i].count > 0) break;
            
                        candidates[i].inRace = false;
                    }
                }

                const inRace = candidates.filter(candidate => candidate.inRace);
                let sum = 0;
                let min = inRace[inRace.length - 1].count;
                inRace.forEach(candidate => sum += candidate.count);
                if (candidates[0].count > sum / 2.0 || candidates[0].count === min)
                    break;

                for (let i = candidates.length - 1; i > 0; i--) {
                    if (candidates[i].count > min) break;

                    candidates[i].inRace = false;
                }

                for (let i = 0; i < candidates.length; i++) {
                    if (!candidates[i].rounds) candidates[i].rounds = [];

                    candidates[i].rounds.push(candidates[i].count);
                }
            }

            return {
                category: category.category,
                results: candidates
            };
        })
    }

    get selectedCategoryInfo (): UserVote[] | ResultVote[] {
        if (this.viewOption === "voters") {
            const group = this.votesByCategory.find(group => group.category === this.selectedCategoryId);
            return group?.userVotes || [];
        }

        const group = this.resultsByCategory.find(group => group.category === this.selectedCategoryId);
        return group?.results || [];
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

    async changeView (option: string) {
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

    &__count {
        display: flex;

        & > div {
            margin-right: 20px;
        }
    }

    &__action {
        margin: 5px;
    }
}

</style>
