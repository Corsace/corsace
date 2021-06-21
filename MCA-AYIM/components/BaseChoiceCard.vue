<template>
    <div class="choice-container">
        <div class="choice">
            <slot />
        
            <div 
                v-if="stage === 'nominating'"
                class="choice__selection"
                @click="nominate"
            >
                <div
                    class="choice__selection-box" 
                    :class="{ 
                        'choice__selection-box--chosen': currentNomination,
                        'choice__selection-box--denied': currentNomination && !currentNomination.isValid
                    }"
                >
                    <template v-if="currentNomination">
                        <img
                            v-if="currentNomination.isValid"
                            class="choice__selection-check"
                            :class="{ 'choice__selection-check--chosen': currentNomination }"
                            src="../../Assets/img/ayim-mca/site/checkmark.png"
                        >
                        <div
                            v-else
                            class="choice__selection-invalid"
                        >
                            ✕
                        </div>
                    </template>
                </div>
            </div>

            <div
                v-else-if="stage === 'voting'"
                class="choice__voting"
                @click="vote"
            >
                <div class="choice__voting-title">
                    vote
                </div>
                <div class="choice__voting-vote">
                    {{ currentVote && currentVote.choice || '!' }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { namespace } from "vuex-class";

import { StageType } from "../../MCA-AYIM/store/stage";
import { Vote } from "../../Interfaces/vote";
import { Nomination } from "../../Interfaces/nomination";

const stageModule = namespace("stage");

@Component
export default class BaseChoiceCard extends Vue {

    @Prop({ type: Object, default: () => ({}) }) readonly choice!: Record<string, any>;

    @stageModule.State selected!: boolean;
    @stageModule.State stage!: StageType;
    @stageModule.Getter relatedCandidacies!: Vote[] | Nomination[];
    @stageModule.Action createVote;
    @stageModule.Action removeVote;
    @stageModule.Action createNomination;
    @stageModule.Action removeNomination;

    get currentVote (): Vote | undefined {
        if (this.stage === "nominating") return undefined;

        return (this.relatedCandidacies as Vote[]).find(v => {
            if (this.choice.id) return v.beatmapset?.ID === this.choice.id;
            else return v.user?.ID === this.choice.corsaceID;
        });
    }

    get currentNomination (): Nomination | undefined {
        if (this.stage === "voting") return undefined;

        return (this.relatedCandidacies as Nomination[]).find(v => {
            if (this.choice.id) return v.beatmapset?.ID === this.choice.id;
            else return v.user?.ID === this.choice.corsaceID;
        });
    }

    async vote () {
        if (this.selected) return;

        if (this.currentVote) {
            await this.removeVote(this.currentVote.ID);
            return;
        }
        
        const id = this.choice.id || this.choice.corsaceID;
        let vote = 1;

        if (this.relatedCandidacies.length) {
            vote = (this.relatedCandidacies as Vote[]).sort((a, b) => b.choice - a.choice)[0].choice + 1;
        }

        await this.createVote({ 
            nomineeId: id,
            vote,
        });
    }

    async nominate () {
        if (this.selected) return;

        if (this.currentNomination) {
            await this.removeNomination(this.currentNomination.ID);
            return;
        }
        
        const id = this.choice.id || this.choice.corsaceID;
        await this.createNomination(id);
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.choice {
    &-container {
        flex: 0 0 auto;
        width: 100%;
        max-width: 100%;

        @include breakpoint(tablet) {
            width: calc(100% / 2);
        }

        @include breakpoint(laptop) {
            width: calc(100% / 2);
        }

        @include breakpoint(desktop) {
            width: calc(100% / 3);
        }
    }

    @extend %flex-box;
    padding: 0;
    box-shadow: 0 0 8px rgba(255,255,255,0.25);
    cursor: pointer;

    @include transition();

    &:hover {
        box-shadow: 0 0 12px rgba(255,255,255,0.75);
    }

}

.choice__voting {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    // position: relative; It should be here instead of .category__selection-maps...

    @include transition('color');

    &-title {
        font-size: $font-sm;
    }

    &-vote {
        font-size: 3rem;
        font-weight: bold;
    }

    &:hover {
        color: $standard;
    }
}

.choice__selection {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;

    padding-bottom: 15px;

    &-box {
        height: 30px;
        width: 30px;
    
        border: 4px solid rgba(255, 255, 255, 0.3); 
        border-radius: 5px;

        @include transition;

        &--chosen, &:hover {
            border-color: white;
            box-shadow: 0 0 4px white, inset 0 0 4px white;
        }

        &--denied {
            border-color: $red;
            box-shadow: 0 0 4px $red, inset 0 0 4px $red;

            &:hover {
                border-color: $red;
                box-shadow: 0 0 4px $red, inset 0 0 4px $red;
            }
        }
    }

    &-check {
        width: 100%;
        height: 100%;

        opacity: 0;

        @include transition;

        &--chosen {
            opacity: 1
        }
    }
    
    &-invalid {
        color: $red;
        text-align: center;
        text-shadow: 0 0 4px $red;
    }
}

.choice__info {
    flex: 5;
    padding: 15px;
    border-radius: 10px 0 0 10px;

    background-size: cover;
    background-position: 34% 30%;
    overflow: hidden;

    color: white;
    text-decoration: none;

    &-title {
        text-shadow: 0 0 2px white;
        font-weight: 500;
        font-size: $font-lg;
        @extend %text-wrap;
    }

    &-artist {
        text-shadow: 0 0 4px white;
        font-size: $font-base;
        @extend %text-wrap;
    }

    &-host {
        @extend %text-wrap;
    }

    &-hoster {
        text-shadow: 0 0 4px white;
        font-style: italic;
        @extend %text-wrap;
    }
}
</style>
