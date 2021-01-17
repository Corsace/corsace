<template>
    <div class="index">
        <div class="general">
            <div class="ranked-sets">
                <small>{{ $t('mca_ayim.main.rankedSets') }}</small>
                <div class="ranked-sets__divider" />
                <div class="ranked-sets__content">
                    {{ splitBeatmapCount[1] }}
                    <span class="ranked-sets__content--highlight">{{ splitBeatmapCount[2] }}</span>
                </div>
            </div>

            <nuxt-link
                v-if="phase && isEligibleFor(selectedMode)"
                class="vote-now"
                :class="[
                    `vote-now--${selectedMode}`,
                ]"
                :to="`/${phase.phase}`"
            >
                {{ $t(`mca_ayim.main.${buttonText}`) }} <span>>></span>
            </nuxt-link>
            <a
                v-else-if="phase"
                class="vote-now vote-now--inactive"
                :class="[
                    `vote-now--${selectedMode}`,
                ]"
                href="#"
                @click.prevent="toggleGuestDifficultyModal"
            >
                {{ $t(`mca_ayim.main.${buttonText}`) }} <span>>></span>
            </a>
        </div>

        <div class="categories">
            <collapsible
                class="categories__list"
                :title="$t('mca_ayim.main.categories.map')"
                :list="beatmapCategories"
                :active="true"
            />
            <collapsible
                class="categories__list"
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
import { Vue, Component } from "vue-property-decorator";
import { Getter, Mutation, State } from "vuex-class";
import Axios from "axios";

import Collapsible from "./Collapsible.vue";

import { Phase } from "../../Interfaces/mca";
import { CategoryInfo } from "../../Interfaces/category";

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

@Component({
    components: {
        Collapsible,
    },
})
export default class IndexContent extends Vue {

    @State phase!: Phase | null;
    @State selectedMode!: string;
    @Getter isEligibleFor!: (mode: string) => boolean;
    @Mutation toggleGuestDifficultyModal!: boolean;
    
    info: FullFrontInfo | null = null;

    get currentModeInfo (): FrontInfo | undefined {
        if (!this.info) return undefined;

        return this.info[this.selectedMode];
    }

    get beatmapCategories (): CategoryInfo[] | undefined {
        return this.currentModeInfo?.categoryInfos.filter(x => x.type === "Beatmapsets");
    }

    get userCategories (): CategoryInfo[] | undefined{
        return this.currentModeInfo?.categoryInfos.filter(x => x.type === "Users");
    }

    get beatmapCount (): string {
        let init: string = this.currentModeInfo ? `${Math.min(9999999, this.currentModeInfo.beatmapCount)}` : "0000000";
            
        while (init.length < 7)
            init = "0" + init;
            
        return init;
    }
    
    get organizers (): string {
        return this.currentModeInfo?.organizers.join(", ") || "";
    }

    get buttonText (): string {
        if (!this.phase) return "";

        const text = {
            nominating: "nominateNow",
            voting: "voteNow", 
        };
        return text[this.phase.phase];
    }

    get splitBeatmapCount (): RegExpExecArray | [] {
        const split = /(^0+)(\d+)/.exec(this.beatmapCount);

        return split || [];
    }

    async mounted () {
        const res = (await Axios.get("/api/front")).data;
        if (res.error) {
            alert(res.error);
            return;
        }

        this.info = res.frontData;
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.index {
    padding-right: 25px;
}

.general {
    @extend %spaced-container;
    margin: 0 -5px;
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
    min-height: 320px;
}

.ranked-sets {
    @extend %flex-box;
    align-items: center;
    justify-content: space-between;

    &__divider {
        border-left: 0.7px solid white;
        width: 1px;
        height: 80%;
        margin-left: 10px;
        margin-right: 10px;
    }

    &__content {
        display: flex;
        font-family: Scoreboard;
        color: #4f4f4f;
        text-shadow: 1px 1px 3px #4f4f4f;
        font-size: 2.6rem
    }

    &__content--highlight {
        color: white;
        text-shadow: 1px 1px 3px white;
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
    @extend %flex-box;
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

    @include transition;
    @include mode-vote-color;

    &--inactive {
        opacity: 0.3;
    }
    
    span {
        margin-left: 15px
    }
}

.organizers {
    @extend %flex-box;
    flex-direction: column;
    padding: 8px;

    &__title {
        border-bottom: 1px solid white;
    }

    &__content {
        padding: 25px;
    }
}

</style>