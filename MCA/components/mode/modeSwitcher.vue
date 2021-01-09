<template>
    <div class="mode-wrapper">
        <div class="mode-title">
            {{ selectedMode }} <span v-if="page!=='admin'">| {{ $t(`mca_ayim.main.${phaseString ? phaseString : phase.phase}`) }}</span>
        </div>

        <div
            class="mode-container"
            :class="`mode-container--${selectedMode}`"
        >
            <admin 
                v-if="page==='admin'"
                :selected-mode="selectedMode"
            />
            <index 
                v-else-if="page==='index'"
                :eligible="eligible"
                :phase="phase"
                :selected-mode="selectedMode"
            />
            <stage 
                v-else-if="page==='stage'"
                :phase="phase"
                :selected-mode="selectedMode"
                @phase="updatePhase"
            />
        </div>
        <div
            class="mode-selection" 
            :class="`mode-selection--${selectedMode}`"
        >
            <div
                v-for="mode in modes"
                :key="mode"
                class="mode-selection__mode"
                :class="[
                    `mode-selection__mode--${mode}`, 
                    (selectedMode == mode) ? `mode-selection__mode--${mode}-selected` : '',
                    user.staff && !user.staff.headStaff && page==='stage' && eligibility && !eligibility[mode] ? `mode-selection__mode--inactive` : '',
                ]"
                
                @click="user.staff && !user.staff.headStaff && page==='stage' && eligibility && !eligibility[mode] ? 0 : setMode(mode)"
            />
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";

import admin from "./pages/admin.vue";
import index from "./pages/index.vue";
import stage from "./pages/stage.vue";

export default Vue.extend({
    components: {
        admin,
        index,
        stage,
    },
    props: {
        page: {
            type: String,
            default: "index",
        },
        phase: {
            type: Object,
            default: function () {
                return {};
            },
        },
        user: {
            type: Object,
            default: function () {
                return {};
            },
        },
        selectedMode: {
            type: String,
            default: "standard",
        },
        eligible: Boolean,
    }, 
    data () {
        return {
            phaseString: "",
            year: /20\d\d/.test(this.$route.params.year) ? this.$route.params.year : (new Date).getUTCFullYear()-1,
            modes: ["standard", "taiko", "fruits", "mania", "storyboard"],
        };
    },
    computed: {
        eligibility(): any {
            const user = this.user;
            return user.eligibility ? user.eligibility.find(x => x.year == this.year) : {};
        },
    },
    methods: {
        setMode(mode) {
            if (/^(standard|taiko|fruits|mania|storyboard)$/.test(mode)) {
                this.$emit("mode", mode);
            }
        },
        updatePhase(phase) {
            this.phaseString = phase;
        },
    },
});
</script>

<style lang="scss">
$modes: "storyboard", "mania" , "fruits", "taiko", "standard";

.mode-wrapper {
    position: relative;

    height: 100%;
    width: calc(100% - 30px);

    display: flex;
    flex-direction: column;
    align-items: flex-end;
    overflow: hidden;

    margin-left: 30px;
}

.mode-title {
    font-family: 'Lexend Peta';
    font-size: 2rem;
    text-shadow: 0 0 4px white;

    white-space: nowrap;

    margin: 95px 25px 10px auto;
}

.mode-container {
    width: 100%;
    height: 100%;
    padding: 25px 0 0 25px;
    overflow: hidden;
}

.mode-selection {
    display: flex;
    align-items: center;
    padding: 10px 25px;
}


@mixin mode-container {
    @each $mode in $modes {
        &--#{$mode} {
            border-top: 3px solid var(--#{$mode});
            &::before {
                border-left: 3px solid var(--#{$mode});
            }
        }
    }
}


.mode-container {
    @include mode-container;

    transition: all 0.25s ease-out;

    border-top-left-radius: 25px;
    &::before {
        content: "";
        display: block;
        position: absolute;
        left: 0px;
        top: 145px;
        width: 100%;
        //full height - mode-title height - mode-selection::before bottom position
        height: calc(100% - 145px - 31px);
        border-top-left-radius: 25px;
        border-bottom-left-radius: 25px;
        z-index: -1;
    }

    &__general {
        flex-wrap: wrap;

        @media (min-width: 1200px) {
            flex-wrap: nowrap;
        }
    }

    &__stats {
        margin-bottom: 20px;

        @media (min-width: 1200px) {
            flex-wrap: nowrap;
        }
    }
}

@mixin mode-vote-color {
    @each $mode in $modes {
        &--#{$mode} {
            color: var(--#{$mode});
            background: linear-gradient(135deg,#222 0%, #222 20%, white 20%, white 22%, #222 22%, #222 24%, white 24%, white 26%, var(--#{$mode}) 26%, var(--#{$mode}) 28%, white 28%);
        }
    }
}

@mixin mode-selection-border {
    @each $mode in $modes {
        $i: index($modes, $mode);

        &--#{$mode} {
            &::before {
                border-bottom: 3px solid var(--#{$mode});
                // - icon padding - icon size + border margin - icon margin
                width: calc(100% - 25px - 45px * #{$i} + 28px - 15px * #{$i - 1});
            }
        }

        &__mode {
            &--#{$mode} {
                background-image: url("../../../CorsaceAssets/img/ayim-mca/#{$mode}.png");

                &::before {
                    border-bottom: 3px solid var(--#{$mode});
                }
            }

            &--#{$mode}-selected {
                background-color: var(--#{$mode});
            }
        }
    }
}

.mode-selection {
    @include mode-selection-border;

    transition: all 0.25s ease-out;

    &__mode {
        cursor: pointer;
        width: 45px;
        height: 45px;
        background-repeat: no-repeat;
        background-size: cover;
        border-radius: 100%;
        margin-left: 15px;
        z-index: 0;

        transition: all 0.25s ease-out;

        &--inactive {
            opacity: 0;
            cursor: default;
        }
    }

    &::before {
        content: "";
        position: absolute;
        height: 100%;
        z-index: -1;
        left: 0;
        bottom: 31px;
        border-bottom-left-radius: 25px;
        transition: all 0.25s ease-out;
    }

}
</style>