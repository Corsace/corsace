<template>
    <base-modal
        title="votes order"
        @close="toggleVoteChoiceBox"
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
    </base-modal>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
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
    @stageModule.Getter relatedVotes!: Vote[];
    @stageModule.Mutation toggleVoteChoiceBox;
    @stageModule.Action createVote;
    @stageModule.Action removeVote;
    @stageModule.Action swapVote;

    maxChoices = 10;

    get sortedVotes () {
        return this.relatedVotes.sort((a, b) => a.choice - b.choice);
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
        const enterVote = this.relatedVotes.find(v => v.ID == id);
        
        if (enterVote && vote && enterVote.ID !== vote.ID) {
            await this.swapVote({
                voteId: vote.ID,
                swapId: enterVote.ID,
            });
        }
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

</style>
