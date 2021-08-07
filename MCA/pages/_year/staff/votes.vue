<template>
    <div class="staff-page">
        <mode-switcher
            hide-phase
            title="voting"
        >
            <div class="staff-main">
                <div class="staff-filters">
                    <search-bar
                        :placeholder="canSearch ?
                            $t('mca.nom_vote.search') :
                            'searching is disabled'"
                        :disabled="!canSearch"
                        @update:search="text = $event"
                    >
                        <button-group
                            :options="viewOptions"
                            :selected-buttons="[viewOption]"
                            @group-clicked="changeView"
                        />
                    </search-bar>
                </div>

                <div class="staff-container staff-searchContainer">
                    <div class="staff-container staff-scrollTrack">
                        <template
                            v-for="category in relatedCategories"
                        >   
                            <staff-accordion-header
                                :key="category.id + '-acc-header'"
                                :left="$t(`mca.categories.${category.name}.name`)"
                                :right="category.type"
                                :active="category.id === selectedCategoryId"
                                @on-click="selectCategory(category.id)"
                            />
                            
                            <staff-vote-accordion
                                v-if="category.id === selectedCategoryId"
                                :key="category.id + '-category'"
                                :view-option="viewOption"
                                :data="selectedCategoryInfo"
                                @remove-vote="removeVote"
                            />
                        </template>
                    </div>
                    <scroll-bar selector=".staff-scrollTrack" />
                </div>
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
import ButtonGroup from "../../../../MCA-AYIM/components/ButtonGroup.vue";
import StaffAccordionHeader from "../../../components/staff/StaffAccordionHeader.vue";
import StaffVoteAccordion from "../../../components/staff/StaffVoteAccordion.vue";

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
        ButtonGroup,
        StaffAccordionHeader,
        StaffVoteAccordion,
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
    viewOption: ViewOption = "results";
    text = "";
    selectedCategoryId: null | number = null;

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
                results: voteCounter(category.userVotes, parseInt(this.$route.params.year)),
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

    get canSearch (): boolean {
        return this.viewOption === "voters";
    }

    async selectCategory (id: number | null) {
        if (!id) return;

        if (this.selectedCategoryId === id) {
            this.votes = [];
            this.selectedCategoryId = null;
            return;
        }

        const { data } = await this.$axios.get(`/api/staff/votes?category=${id}`);

        if (data.error) {
            alert(data.error);
            return;
        }

        this.votes = data;
        this.selectedCategoryId = id;
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
        if (option !== this.viewOption) {
            this.votes = [];
            this.selectedCategoryId = null;
        }
        this.viewOption = option;
        this.text = "";
    }
}
</script>

