<template>
    <base-modal
        title="votes order"
        @close="close"
    >
        <div
            class="voting-title"
            :class="`voting-title--${selectedMode}`"
        >
            drag and drop to swap vote position
        </div>

        <div class="voting-items">
            <div
                v-for="vote in sortedVotes"
                :key="vote.ID"
                class="voting-item"
            >
                <div
                    class="voting-item__title"
                    draggable
                    @dragstart="dragData($event, vote)"
                    @dragenter.prevent="dragEnter($event, vote.ID)"
                    @dragleave.prevent="toggleClass($event)"
                    @dragover.prevent
                    @drop="dropData($event, vote)"
                >
                    {{ formatTitle(vote) }}
                </div>

                <a
                    href="#"
                    class="voting-item__remove"
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

    toggleClass (e) {
        e?.target.classList.toggle("voting-item__title--" + this.selectedMode);
    }

    dragEnter (e, voteId: number) {
        const id = e.dataTransfer.getData("voteId");

        if (id != voteId) {
            this.toggleClass(e);
        }
    }

    dragData (e, vote: Vote) {
        e.dataTransfer.dropEffect = "move";
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("voteId", vote.ID);
    }

    async dropData (e, vote: Vote) {
        this.toggleClass(e);
        const id = e.dataTransfer.getData("voteId");
        const draggedIndex = this.newOrder.findIndex(v => v.ID == id);
        const droppedIndex = this.newOrder.findIndex(v => v.ID == vote.ID);
        
        if (draggedIndex !== -1 && vote && this.newOrder[draggedIndex].ID !== vote.ID) {
            const oldChoice = this.newOrder[draggedIndex].choice;
            this.newOrder[draggedIndex].choice = vote.choice;
            this.newOrder[droppedIndex].choice = oldChoice;
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
    cursor: pointer;

    &__title {
        text-align: left;
        width: 100%;
        padding: 10px 15px;
        margin: 5px;
        background-color: $gray-dark;
        border-radius: 20px;
        
        @each $mode in $modes {
            &--#{$mode} {
                background-color: var(--#{standard});
            }
        }
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
