<template>
    <div
        class="voting"
        :class="`voting--${selectedMode}`"
    >
        <div
            class="voting__title"
            :class="`voting__title--${selectedMode}`"
        >
            drag and drop to swap vote position
        </div>
        <div>
            <ul>
                <li
                    v-for="vote in sortedVotes"
                    :key="vote.ID"
                >
                    <div 
                        style="padding: 10px; margin: 5px; background-color: gray;"
                        draggable
                        @dragstart="dragData($event, vote)"
                        @dragenter.prevent
                        @dragover.prevent
                        @drop="swapVotes($event, vote)"
                    >
                        {{ formatTitle(vote) }}
                    </div>

                    <a
                        href="#"
                        class="vote-choice__remove"
                        @click.stop="remove(vote.ID)"
                    >
                        X
                    </a>
                </li>
            </ul>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace, State } from "vuex-class";
import { BeatmapsetInfo } from "../../../Interfaces/beatmap";
import { UserCondensedInfo } from "../../../Interfaces/user";

import { Vote } from "../../../Interfaces/vote";
import { SectionCategory } from "../../../MCA-AYIM/store/stage";

const stageModule = namespace("stage");

@Component
export default class VotingBox extends Vue {
    
    @State selectedMode!: string;
    @stageModule.State section!: SectionCategory;
    @stageModule.State beatmaps!: BeatmapsetInfo[];
    @stageModule.State users!: UserCondensedInfo[];
    @stageModule.Getter relatedVotes!: Vote[];
    @stageModule.Action createVote;
    @stageModule.Action removeVote;

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

    dragData (e, vote: Vote) {
        e.dataTransfer.dropEffect = "move";
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("voteId", vote.ID);
    }

    swapVotes (e, vote: Vote) {
        const id = e.dataTransfer.getData("voteId");
        const enterVote = this.relatedVotes.find(v => v.ID == id);
        
        if (enterVote && vote) {
            const enterChoice = enterVote.choice;
            enterVote.choice = vote.choice;
            vote.choice = enterChoice;
        }
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.voting {
    position: absolute;
    margin-top: 15px;
    background: black;
    border-radius: $border-radius;
    box-shadow: 0 0 8px 2px rgb($standard, .55);
    padding: 5px;
    min-width: 300px;
    z-index: 1;

    @include mode-border;

    &__title {
        text-transform: uppercase;
        text-align: right;

        @include mode-border([bottom]);
    }

    &__list {
        display: flex;
        justify-content: space-around;
    }
}

.vote-choice {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    &__number {
        font-size: $font-xl;
        font-weight: bold;
        padding: 5px 15px;

        @each $mode in $modes {
            &--#{$mode}:hover:not(&--inactive) {
                color: var(--#{standard});
            }
        }
        
        &--inactive {
            color: $gray-dark;
        }
    }

    &__remove {
        color: $red;

        &:hover {
            font-weight: bold;
        }
    }
}

</style>

