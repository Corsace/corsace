<template>
    <div v-if="phase">
        <div
            v-if="phase.phase && (phase.phase === 'nominating' || phase.phase === 'voting')"
            class="stage__remainingDays" 
            :class="`stage__remainingDays--${selectedMode}`"
        >
            <div class="stage__remainingDaysNumber">
                {{ remainingDays }}
            </div> 
            <div class="stage__remainingDaysLeft">
                days left 
            </div>
            <div class="stage_remainingDaysExclamation">
                !
            </div>
            <div class="stage_remainingDaysExclamation">
                !
            </div>
        </div>
        <div class="stage-wrapper">
            <mode-switcher
                :enable-mode-eligibility="true"
                @inactiveModeClicked="toggleGuestDifficultyModal"
            >
                <stage-page />
            </mode-switcher>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Getter, Mutation, State } from "vuex-class";

import ModeSwitcher from "../../../MCA-AYIM/components/ModeSwitcher.vue";
import StagePage from "../../components/stage/StagePage.vue";

import { Phase } from "../../../Interfaces/mca";

@Component({
    components: {
        ModeSwitcher,
        StagePage,
    },
    validate ({ params }): boolean {
        const stageRegex = /^(nominating|nominate|vote|voting)$/i;

        // /2020/nominating
        return /^20\d\d$/.test(params.year) && stageRegex.test(params.stage);
    },
    head () {
        return {
            title: `${this.$route.params.stage} | MCA`,
        };
    },
})
export default class Stage extends Vue {

    @State selectedMode!: string;
    @Getter phase!: Phase;
    @Mutation toggleGuestDifficultyModal;

    get remainingDays (): string {
        if (this.phase) {
            const date = Math.floor((this.phase.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return date > 9 ? date.toString() : "0" + date;
        }

        return "0";
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';

.stage-wrapper {
    padding-top: 35px;
    height: 100%;
    width: 100%;
}

.stage__remainingDays {
    position: absolute;
    background-color: white;
    left: 5%;
    border-radius: 0 0 10px 10px;
    padding-left: 0.7%;
    padding-top: 0.5%;
    display: flex;
    align-items: center;
    line-height: calc(1/6);
    overflow: hidden;
    z-index: -100;

    @include mode-text-color;
    @include transition;
}

.stage__remainingDaysNumber {
    font-size: 6rem;
    font-weight: bold;
}

.stage__remainingDaysLeft {
    font-size: 1.5rem;
    padding: 0 4px;
    letter-spacing: 1px;
}

.stage_remainingDaysExclamation {
    font-size: 12rem;
    font-weight: 900;
    transform: rotate(30deg);
    margin-bottom: 10%;
}
</style>