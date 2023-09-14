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
import { namespace } from "vuex-class";
import { BeatmapsetInfo } from "../../../Interfaces/beatmap";
import { UserChoiceInfo } from "../../../Interfaces/user";

import { Vote } from "../../../Interfaces/vote";
import { SectionCategory } from "../../../Interfaces/category";
import BaseModal from "../../../Assets/components/BaseModal.vue";

const mcaAyimModule = namespace("mca-ayim");
const stageModule = namespace("stage");

@Component({
    components: {
        BaseModal,
    },
})
export default class VotingBox extends Vue {
    
    @mcaAyimModule.State selectedMode!: string;

    @stageModule.State section!: SectionCategory;
    @stageModule.State beatmaps!: BeatmapsetInfo[];
    @stageModule.State users!: UserChoiceInfo[];
    @stageModule.Getter relatedCandidacies!: Vote[];
    @stageModule.Mutation toggleVoteChoiceBox!: () => void;
    @stageModule.Action removeVote!: (voteId: number) => Promise<void>;
    @stageModule.Action swapVotes!: (votes: Vote[]) => Promise<void>;

    @Watch("relatedCandidacies", { immediate: true })
    onChanged () {
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
        if (this.section === "beatmaps") {
            const targetMap = this.beatmaps.find(b => b.id === (vote.beatmap ? vote.beatmap.ID : vote.beatmapset!.ID));
            if (targetMap)
                target = targetMap.title;
            else
                target = vote.beatmapset?.title ?? "";
        } else 
            target = vote.user?.osu.username ?? "";
        
        return vote.choice + " - " + target;
    }
    
    dragStart (e: DragEvent, vote: Vote) {
        this.dragging = vote.ID;
        if (!e.dataTransfer)
            return;
        e.dataTransfer.dropEffect = "move";
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("voteId", vote.ID.toString());
    }

    toggleHighlightClass (e: DragEvent, voteId: number) {
        if (!e.dataTransfer || !e.target || !(e.target instanceof HTMLElement))
            return;

        const id = e.dataTransfer.getData("voteId");
        if (id !== voteId.toString())
            e.target.classList.toggle("voting-item__" + this.selectedMode);
    }

    dragEnd () {
        this.dragging = null;
    }

    dropData (e: DragEvent, vote: Vote) {
        if (!e.dataTransfer)
            return;

        this.dragging = null;
        this.toggleHighlightClass(e, vote.ID);
        const id = e.dataTransfer.getData("voteId");
        const draggedIndex = this.newOrder.findIndex(v => v.ID.toString() == id);
        
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
        background-color: $dark-gray;
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
            background-color: $dark-gray;
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
