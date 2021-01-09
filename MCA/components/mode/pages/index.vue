<template>
    <div class="index">
        <div class="general">
            <div class="ranked-sets">
                <small>{{ $t('mca_ayim.main.rankedSets') }}</small>
                <div class="ranked-sets__divider" />
                <div class="ranked-sets__content">
                    {{ /(^0+)(\d+)/.exec(beatmapCount)[1] }}<span class="ranked-sets__content--highlight">{{ /(^0+)(\d+)/.exec(beatmapCount)[2] }}</span>
                </div>
            </div>

            <a
                class="vote-now"
                :class="[
                    `vote-now--${selectedMode}`,
                    {'vote-now--inactive': !eligible},
                ]"
                :href="eligible ? `/${phase.phase}` : undefined"
            >
                {{ $t(`mca_ayim.main.${buttonText}`) }} <span>>></span>
            </a>
        </div>

        <div class="categories">
            <collapsible
                class="categories__list"
                :selected-mode="selectedMode"
                :title="$t('mca_ayim.main.categories.map')"
                :list="beatmapCategories"
                :active="true"
            />
            <collapsible
                class="categories__list"
                :selected-mode="selectedMode"
                :title="$t('mca_ayim.main.categories.user')"
                :list="userCategories"
                :active="true"
            />
        </div>
            
        <div class="organizers">
            <div class="organizers__title">
                <small>{{ $t('mca_ayim.main.organized') }}</small>
            </div>
            <div class="organizers__content">
                {{ organizers }}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Axios from "axios";

import collapsible from "../../collapsible.vue";

import { CategoryInfo } from "../../../../CorsaceModels/MCA_AYIM/category";

interface FullFrontInfo {
    standard: FrontInfo;
    taiko: FrontInfo;
    fruits: FrontInfo;
    mania: FrontInfo;
    storyboard: FrontInfo;
}

interface FrontInfo {
    categoryInfos: CategoryInfo[];
    beatmapCount: number;
    organizers: string[];
}

export default Vue.extend({
    components: {
        collapsible,
    },
    props: {
        selectedMode: {
            type: String,
            default: "standard",
        },
        phase: {
            type: Object,
            default: function () {
                return {};
            },
        },
        eligible: Boolean,
    },
    data () {
        return {
            info: {} as FullFrontInfo,
        };
    },
    computed: {
        currentModeInfo(): FrontInfo {
            return this.info[this.selectedMode];
        },
        beatmapCategories(): CategoryInfo[] {
            return this.currentModeInfo?.categoryInfos.filter(x => x.type === "Beatmapsets");
        },
        userCategories(): CategoryInfo[] {
            return this.currentModeInfo?.categoryInfos.filter(x => x.type === "Users");
        },
        beatmapCount(): string {
            let init: string = this.currentModeInfo ? `${Math.min(9999999, this.currentModeInfo.beatmapCount)}` : "0000000";
            
            while (init.length < 7)
                init = "0" + init;
            
            return init;
        },
        organizers(): string {
            return this.currentModeInfo?.organizers.join(", ");
        },
        buttonText(): string {
            const text = {
                nominating: "nominateNow",
                voting: "voteNow", 
            };
            return text[this.phase.phase];
        },
    },
    async mounted () {
        const res = (await Axios.get("/api/front")).data;
        if (res.error) {
            alert(res.error);
            return;
        }

        this.info = res.frontData;
    },
});
</script>

<style lang="scss">
$modes: "storyboard", "mania" , "fruits", "taiko", "standard";

%spaced-container {
    margin-bottom: 15px;
    display: flex;
    justify-content: space-around;
}

%half-box {
    border-radius: 15px; 
    background-color: rgba(0, 0, 0, 0.7); 
    padding: 5px 20px;
    display: flex;
    flex: 1 1 100%;
    
    @media (min-width: 1200px) {
        flex-wrap: nowrap;
        flex: 1 1 50%;
    }
}

.index {
    padding-right: 25px;
}

.general {
    @extend %spaced-container;
    flex-wrap: wrap;

    @media (min-width: 1354px) {
        flex-wrap: nowrap;
    }
}

.categories {
    @extend %spaced-container;

    &__category-title {
        border-bottom: 2px solid #fff;
        margin-bottom: 15px;
        font-weight: bold;
        font-size: 1.5rem;
    }

    &__category-award {
        margin-bottom: 8px;
    }
}

.categories__list {
    height: 320px;
}

.ranked-sets {
    @extend %half-box;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    &__divider {
        border-left: 0.7px solid white;
        width: 1px;
        height: 80%;
        margin-left: 10px;
        margin-right: 10px;
    }

    &__content {
        font-family: Scoreboard;
        color: #4f4f4f;
        text-shadow: 1px 1px 3px #4f4f4f;
        font-size: 2.6rem
    }

    &__content--highlight {
        color: white;
        text-shadow: 1px 1px 3px white;
    }

    @media (min-width: 1200px) {
        margin-right: 10px;
        margin-bottom: 0px;
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

.vote-now {
    @extend %half-box;
    justify-content: flex-end;
    align-items: center;

    cursor: pointer;

    font-style: italic;
    font-size: 1.7rem;
    font-weight: 900;
    letter-spacing: 1.2px;
    text-decoration: none;
    text-shadow: 1px 1px 3px #222;
    background: white;

    transition: all 0.25s ease-out;

    span {
        margin-left: 15px
    }

    @include mode-vote-color;
    
    @media (min-width: 1200px) {
        margin-left: 10px;
    }

    &--inactive {
        opacity: 0;
        cursor: default;
    }
}

.organizers {
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;
    border-radius: 15px;
    background-color: rgba(0, 0, 0, 0.66); 
    padding: 8px;

    &__title {
        border-bottom: 1px solid white;
    }

    &__content {
        padding: 25px;
    }
}

</style>