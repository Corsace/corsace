<template>
    <base-modal
        title="votes order"
        @close="close"
    >
        <div
            class="voting-title"
            :class="`voting-title--${selectedMode}`"
        >
            drag and drop to move vote position
        </div>

        <div class="voting-items">
            <div
                v-for="vote in sortedVotes"
                :key="vote.ID"
                class="voting-item"
                :class="{ 'voting-item--dragged': dragging === vote.ID }"
                draggable
                @dragstart="dragStart($event, vote)"
                @dragenter.prevent="toggleHighlightClass($event, vote.ID)"
                @dragleave.prevent="toggleHighlightClass($event, vote.ID)"
                @dragover.prevent
                @dragend.prevent="dragEnd"
                @drop="dropData($event, vote)"
            >
                <div
                    class="voting-item__drag"
                    :class="{ 'voting-item__drag--hidden': dragging }"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        class="bi bi-grip-vertical"
                        viewBox="0 0 16 16"
                    >
                        <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                    </svg>
                </div>
                    
                <div class="voting-item__title">
                    {{ formatTitle(vote) }}
                </div>

                <a
                    href="#"
                    class="voting-item__remove"
                    :class="{ 'voting-item__drag--hidden': dragging }"
                    @click.stop="remove(vote.ID)"
                >
                    ✕
                </a>
            </div>
        </div>

        <div class="voting-actions">
            <button
                class="button button--small"
                @click="save"
            >
                Save
            </button>
            <button
                class="button button--small"
                @click="reset"
            >
                Reset
            </button>
        </div>
    </base-modal>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { namespace, State } from "vuex-class";
import { BeatmapsetInfo } from "../../../Interfaces/beatmap";
import { UserCondensedInfo } from "../../../Interfaces/user";

import { Vote } from "../../../Interfaces/vote";
import { SectionCategory } from "../../../MCA-AYIM/store/stage";
import BaseModal from "../../../MCA-AYIM/components/BaseModal.vue";

const stageModule = namespace("stage");

@Component({
    components: {
        BaseModal,
    },
})
export default class VotingBox extends Vue {
    
    @State selectedMode!: string;
    @stageModule.State section!: SectionCategory;
    @stageModule.State beatmaps!: BeatmapsetInfo[];
    @stageModule.State users!: UserCondensedInfo[];
    @stageModule.Getter relatedCandidacies!: Vote[];
    @stageModule.Mutation toggleVoteChoiceBox;
    @stageModule.Action createVote;
    @stageModule.Action removeVote;
    @stageModule.Action swapVotes;

    @Watch("relatedCandidacies", { immediate: true })
    async onChanged () {
        this.reset();
    }

    newOrder: Vote[] = [];
    dragging: null | number = null;

    get sortedVotes () {
        return this.newOrder.sort((a, b) => a.choice - b.choice);
    }

    async remove (voteId: number) {
        await this.removeVote(voteId);
    }

    formatTitle (vote: Vote) {
        let target = "";
        if (this.section === "beatmaps") target = vote.beatmapset?.title || "";
        else target = vote.user?.osu.username || "";
        
        return vote.choice + " - " + target;
    }
    
    dragStart (e, vote: Vote) {
        this.dragging = vote.ID;
        e.dataTransfer.dropEffect = "move";
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("voteId", vote.ID);
    }

    toggleHighlightClass (e, voteId: number) {
        const id = e.dataTransfer.getData("voteId");

        if (id != voteId) {
            e.target.classList.toggle("voting-item__" + this.selectedMode);
        }
    }

    dragEnd () {
        this.dragging = null;
    }

    async dropData (e, vote: Vote) {
        this.dragging = null;
        this.toggleHighlightClass(e, vote.ID);
        const id = e.dataTransfer.getData("voteId");
        const draggedIndex = this.newOrder.findIndex(v => v.ID == id);
        
        if (draggedIndex !== -1 && vote && this.newOrder[draggedIndex].ID !== vote.ID) {
            const replacedChoice = vote.choice;
            const draggedChoice = this.newOrder[draggedIndex].choice;
            let minVote = Math.min(replacedChoice, draggedChoice);
            let maxVote = Math.max(replacedChoice, draggedChoice);
            
            const votesToMove = this.newOrder.filter(v => 
                v.choice >= minVote && 
                v.choice <= maxVote
            );

            for (const voteToMove of votesToMove) {
                if (draggedChoice > replacedChoice) voteToMove.choice++;
                else voteToMove.choice--;
            }

            this.newOrder[draggedIndex].choice = replacedChoice;
        }
    }

    async save () {
        await this.swapVotes(this.newOrder);
    }

    reset () {
        this.newOrder = JSON.parse(JSON.stringify(this.relatedCandidacies));
    }

    close () {
        this.toggleVoteChoiceBox();
        this.reset();
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.voting-title {
    text-transform: uppercase;
    text-align: center;
    margin-bottom: 10px;

    @include mode-border([bottom]);
}

.voting-items {
    padding: 5px;
    overflow-y: auto;
    max-height: 60vh;
}

.voting-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    &--dragged {
        background-color: $gray-dark;
        opacity: .5;
    }
    
    &__drag {
        cursor: grab;
        margin: 5px;
        padding: 10px;

        &--hidden {
            opacity: 0;
        }
        
        &:hover {
            background-color: $gray-dark;
        }
    }

    @each $mode in $modes {
        &__#{$mode} {
            border: 3px solid var(--#{standard});
        }
    }

    &__title {
        text-align: left;
        width: 100%;
        margin: 5px;
        padding: 10px;
    }

    &__remove {
        font-size: $font-lg;
        padding: 0 10px;
        color: $red;

        &:hover {
            font-weight: bold;
        }
    }
}

.voting-actions {
    @extend %spaced-container;
    gap: 10px;
}

</style>
