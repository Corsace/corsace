<template>
    <div>
        <div
            v-if="phase.phase && (phase.phase === 'nominating' || phase.phase === 'voting')"
            class="stage__remainingDays" 
            :class="`stage__remainingDays--${mode}`"
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
        <modeSwitcher
            :page="'stage'"
            :phase="phase"
            :selected-mode="mode"
            :user="user"
            @mode="updateMode"
        />
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import modeSwitcher from "../../components/mode/modeSwitcher.vue";

export default Vue.extend({
    validate ({ params }) {
        if (/^(nominating|nominate|vote|voting)$/i.test(params.year))
        {
            if (/^(nominating|nominate|vote|voting)$/i.test(params.stage))
                return false;

            params.stage = params.year;
            params.year = ((new Date).getUTCFullYear()-1).toString();
        }

        return params.year && !/^20\d\d$/.test(params.year) ? false : /^(nominating|nominate|vote|voting)$/i.test(params.stage);
    },
    components: {
        "modeSwitcher": modeSwitcher,
    },
    data () {
        return {
            modes: ["standard", "taiko", "fruits", "mania", "storyboard"],
        };
    },
    computed: {
        remainingDays (): string {
            const date = Math.floor((this.phase.endDate - Date.now()) / (1000*60*60*24));
            return date > 9 ? date.toString() : "0" + date;
        },
        eligible () {
            return this.$parent.$attrs.eligible;
        },
        mode () {
            return this.$parent.$attrs.mode;
        },
        phase () {
            return this.$parent.$attrs.phase as any;
        },
        user () {
            return this.$parent.$attrs.user;
        },
    },
    methods: {
        updateMode (val) {
            this.$parent.$emit("mode", val);
        },
    },
});
</script>

<style lang="scss">
$modes: "storyboard", "mania" , "fruits", "taiko", "standard";

@mixin mode-vote-color {
    @each $mode in $modes {
        &--#{$mode} {
            color: var(--#{$mode});
        }
    }
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

    @include mode-vote-color;

    transition: all 0.25s ease-out;
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