<template>
    <div class="staff-page">
        <mode-switcher
            hide-phase
            title="nominations"
        >
            <div class="staff-main">
                <div class="staff-filters">
                    <search-bar
                        :placeholder="$t('mca.nom_vote.search')"
                        @update:search="text = $event"
                    >
                        <button-group
                            :options="['valid', 'invalid']"
                            :selected-buttons="selectedViewOptions"
                            @group-clicked="changeView"
                        />
                        <button
                            v-if="!showReviewed"
                            class="button"
                            @click="showReviewed = true"
                        >
                            Show Reviewed
                        </button>
                        <button
                            v-else-if="showReviewed"
                            class="button"
                            :class="{ 'button--disabled': !selectedViewOptions.includes('valid') }"
                            @click="!selectedViewOptions.includes('valid') ? undefined : showReviewed = false"
                        >
                            Hide Reviewed
                        </button>
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
                            
                            <staff-nomination-accordion
                                v-if="category.id === selectedCategoryId"
                                :key="category.id + '-category'"
                                :nominations="selectedCategoryNominations"
                                @update-nomination="updateNomination"
                                @delete-nomination="deleteNomination"
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
import StaffNominationAccordion from "../../../components/staff/StaffNomAccordion.vue";

import { CategoryInfo } from "../../../../Interfaces/category";
import { StaffNomination } from "../../../../Interfaces/nomination";

const staffModule = namespace("staff");

interface NominationsByCategory {
    categoryId: number;
    userNominations: StaffNomination[];
}

@Component({
    components: {
        ModeSwitcher,
        ScrollBar,
        SearchBar,
        ButtonGroup,
        StaffAccordionHeader,
        StaffNominationAccordion,
    },
    head () {
        return {
            title: "Nominations | Staff | MCA",
        };
    },
})
export default class Nominations extends Vue {
    
    @State selectedMode!: string;
    @staffModule.State categories!: CategoryInfo[];

    nominations: StaffNomination[] = [];
    viewOptions = ["valid", "invalid"];
    selectedViewOptions = ["valid", "invalid"];
    text = "";
    showReviewed = true;
    selectedCategoryId: null | number = null;

    get relatedCategories (): CategoryInfo[] {
        return this.categories.filter(c => c.mode === this.selectedMode || c.mode === "storyboard");
    }

    get nominationsByCategory (): NominationsByCategory[] {
        const categories: NominationsByCategory[] = [];

        for (const nomination of this.nominations) {
            if (nomination.reviewer && !this.showReviewed) continue;
            if (!nomination.isValid && !this.selectedViewOptions.includes("invalid")) continue;	
            else if (nomination.isValid && !this.selectedViewOptions.includes("valid")) continue;

            if (this.text) {
                const lowerText = this.text.toLowerCase();
                if (nomination.user?.osuID) {
                    if (
                        !nomination.nominators.some(n => n.osuUsername.toLowerCase().includes(lowerText)) &&
                        !nomination.nominators.some(n => n.osuID.includes(lowerText)) &&
                        !nomination.nominators.some(n => n.discordUsername.includes(lowerText)) &&
                        !nomination.user.osuUsername.toLowerCase().includes(lowerText) && 
                        !nomination.user.osuID.includes(lowerText) &&
                        !nomination.user.discordUsername.toLowerCase().includes(lowerText)
                    )
                        continue;
                } else if (nomination.beatmapset?.ID) {
                    if (
                        !nomination.nominators.some(n => n.osuUsername.toLowerCase().includes(lowerText)) &&
                        !nomination.nominators.some(n => n.osuID.includes(lowerText)) &&
                        !nomination.nominators.some(n => n.discordUsername.includes(lowerText)) &&
                        !nomination.beatmapset.ID.toString().includes(lowerText) &&
                        !nomination.beatmapset.artist.toLowerCase().includes(lowerText) &&
                        !nomination.beatmapset.title.toLowerCase().includes(lowerText) &&
                        !nomination.beatmapset.tags.toLowerCase().includes(lowerText) &&
                        !nomination.beatmapset.creator!.osuUsername.toLowerCase().includes(lowerText) && 
                        !nomination.beatmapset.creator!.osuID.includes(lowerText) &&
                        !nomination.beatmapset.creator!.discordUsername.toLowerCase().includes(lowerText)
                    )
                        continue;
                }
            }

            const categoryIndex = categories.findIndex(g => g.categoryId === nomination.categoryId);

            if (categoryIndex !== -1) {
                categories[categoryIndex].userNominations.push(nomination);
            } else {
                categories.push({
                    categoryId: nomination.categoryId,
                    userNominations: [nomination],
                });
            }
        }

        return categories;
    }

    get selectedCategoryNominations (): StaffNomination[] {
        const group = this.nominationsByCategory.find(group => group.categoryId === this.selectedCategoryId);
        return group?.userNominations || [];
    }

    async changeView (option: string) {
        const newSelection = this.selectedViewOptions.filter(o => o !== option);
        const arrayEquality = newSelection.every(e => this.selectedViewOptions.includes(e)) && 
            this.selectedViewOptions.length === newSelection.length;
        if (arrayEquality)
            this.selectedViewOptions.push(option);
        else if (newSelection.length === 0)
            this.selectedViewOptions = this.viewOptions.filter(o => o !== option);
        else
            this.selectedViewOptions = newSelection;
        
        if (!this.selectedViewOptions.includes("valid"))
            this.showReviewed = true;
    }

    async selectCategory (id: number) {
        if (this.selectedCategoryId === id) {
            this.nominations = [];
            this.selectedCategoryId = null;
            return;
        }
        const { data } = await this.$axios.get(`/api/staff/nominations?category=${id}`);

        if (data.error) {
            alert(data.error);
            return;
        }

        this.nominations = data.sort((a, b) => b.nominators.length - a.nominators.length);
        this.selectedCategoryId = id;
    }

    async updateNomination (id: number, isValid: boolean) {
        if (!isValid && !confirm("Marking a nomination as invalid will hide the nomination from the list of choices in the nominating page and remove all nominators from the nomination. You will require to delete the nomination in order to remove the invalidation. Do you understand"))
            return;

        const { data } = await this.$axios.post(`/api/staff/nominations/${id}/update`, {
            isValid,
        });

        if (!data.error) {
            this.updateLocalNomination(id, data);
        } else {
            alert("Hellooo peep console (Ctrl + Shift + I then console tab at top)");
            console.error(data.error);
        }
    }

    updateLocalNomination (id: number, data) {
        const i = this.nominations.findIndex(n => n.ID === id);
        if (i !== -1) {
            this.nominations[i].reviewer = data.reviewer;
            this.nominations[i].lastReviewedAt = data.lastReviewedAt;
            this.nominations[i].isValid = data.isValid;
        }
    }

    async deleteNomination (id: number) {
        if (!confirm("Only use this for duplicate nominations, nominations with no users nominating, and/or nominations wrongly marked as invalid. Do you understand"))
            return;

        const { data } = await this.$axios.delete(`/api/staff/nominations/${id}`);

        if (!data.error) {
            this.deleteLocalNomination(id);
        } else {
            alert("Hellooo peep console (Ctrl + Shift + I then console tab at top)");
            console.error(data.error);
        }
    }

    deleteLocalNomination (id: number) {
        this.nominations = this.nominations.filter(n => n.ID !== id);
    }
}
</script>
