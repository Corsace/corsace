<template>
    <div class="choice">
        <slot />
        
        <div 
            v-if="stage === 'nominating'"
            class="choice__selection"
            @click="$emit('choose')"
        >
            <div
                class="choice__selection-box" 
                :class="{ 'choice__selection-box--chosen': choice.chosen }"
            >
                <img
                    class="choice__selection-check"
                    :class="{ 'choice__selection-check--chosen': choice.chosen }"
                    src="../../Assets/img/ayim-mca/site/checkmark.png"
                >
            </div>
        </div>

        <div
            v-else-if="stage === 'voting'"
            class="choice__voting"
            @click="togglePopup()"
        >
            <div class="choice__voting-title">
                vote
            </div>
            <div class="choice__voting-vote">
                {{ currentVote && currentVote.choice || '!' }}
            </div>

            <transition name="fade">
                <voting-box
                    v-if="votingFor === (choice.id || choice.corsaceID)"
                    :choice="choice"
                />
            </transition>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { namespace } from "vuex-class";

import VotingBox from "./stage/VotingBox.vue";

import { StageType } from "../store/stage";
import { Vote } from "../../Interfaces/vote";

const stageModule = namespace("stage");

@Component({
    components: {
        VotingBox,
    },
})
export default class BaseChoiceCard extends Vue {

    @Prop({ type: Object, default: () => ({}) }) readonly choice!: Record<string, any>;
    
    @stageModule.State votingFor!: null | number;
    @stageModule.Mutation updateVotingFor;
    @stageModule.State stage!: StageType;
    @stageModule.Getter relatedVotes!: Vote[];

    get currentVote (): Vote | undefined {
        return this.relatedVotes.find(v => {
            if (this.choice.id) return v.beatmapset?.ID === this.choice.id;
            else return v.user?.ID === this.choice.corsaceID;
        });
    }

    togglePopup () {
        const id = this.choice.id || this.choice.corsaceID;

        if (id === this.votingFor) {
            this.updateVotingFor(null);
        } else {
            this.updateVotingFor(id);
        }
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.choice {
    @extend %flex-box;
    flex: 1;
    padding: 0;
    min-width: 350px;
    box-shadow: 0 0 8px rgba(255,255,255,0.25);

    cursor: pointer;
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

    padding-bottom: 4%;

    &-box {
        height: 35px;
        width: 35px;
    
        border: 4px solid rgba(255, 255, 255, 0.3); 
        border-radius: 5px;

        @include transition;
        
        &--chosen {
            border-color: white;
            box-shadow: 0 0 4px white, inset 0 0 4px white;
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

    &-hoster {
        text-shadow: 0 0 4px white;
        font-style: italic;
        @extend %text-wrap;
    }
}
</style>
