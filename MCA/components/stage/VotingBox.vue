<template>
    <div
        class="voting"
        :class="`voting--${selectedMode}`"
    >
        <div
            class="voting__title"
            :class="`voting__title--${selectedMode}`"
        >
            voting for {{ title }} -
            remaining votes
        </div>
        <div class="voting__list">
            <div
                v-for="i in maxChoices"
                :key="i"
                class="vote-choice"
            >
                <div
                    v-if="chosenVote(i)"
                    class="vote-choice__number vote-choice__number--inactive"
                >
                    {{ i }}
                </div>
                <a
                    v-else
                    href="#"
                    class="vote-choice__number"
                    @click.stop="vote(i)"
                >
                    {{ i }}
                </a>

                <a
                    v-if="chosenVote(i)"
                    href="#"
                    class="vote-choice__remove"
                    @click.stop="remove(i)"
                >
                    X
                </a>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace, State } from "vuex-class";
import { BeatmapsetInfo } from "../../../Interfaces/beatmap";
import { UserCondensedInfo } from "../../../Interfaces/user";

import { Vote } from "../../../Interfaces/vote";
import { SectionCategory } from "../../store/stage";

const stageModule = namespace("stage");

@Component
export default class VotingBox extends Vue {
    
    @State selectedMode!: string;
    @stageModule.State section!: SectionCategory;
    @stageModule.State votingFor!: number;
    @stageModule.State beatmaps!: BeatmapsetInfo[];
    @stageModule.State users!: UserCondensedInfo[];
    @stageModule.Getter relatedVotes!: Vote[];
    @stageModule.Action createVote;
    @stageModule.Action removeVote;

    maxChoices = 10;

    get votingObject (): UserCondensedInfo | BeatmapsetInfo | undefined {
        if (this.section === "beatmaps") {
            return this.beatmaps.find(b => b.id === this.votingFor);
        } else if (this.section === "users") {
            return this.users.find(u => u.corsaceID === this.votingFor);
        }
        
        return undefined;
    }

    get title (): string {
        if (!this.votingObject) return "";

        if (this.section === "beatmaps") return (this.votingObject as BeatmapsetInfo).title;
        else return (this.votingObject as UserCondensedInfo).username;
    }

    chosenVote (i: number): Vote | undefined {
        return this.relatedVotes.find(v => v.choice === i);
    }

    async vote (vote: number) {
        await this.createVote({ 
            nomineeId: this.votingFor,
            vote,
        });
    }
    
    async remove (voteChoice: number) {
        const vote = this.chosenVote(voteChoice);

        if (vote) {
            await this.removeVote(vote.ID);
        }
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.voting {
    margin-top: 15px;
    background: black;
    border-radius: $border-radius;
    box-shadow: 0 0 8px 2px rgb($standard, .55);
    padding: 5px;
    cursor: default;

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

