<template>
    <div class="index">
        <div 
            v-if="mca" 
            class="general"
        >
            <div class="ranked-sets">
                <small>{{ $t('mca.main.rankedSets') }}</small>
                <div class="ranked-sets__divider" />
                <div class="ranked-sets__content">
                    {{ splitBeatmapCount[1] }}
                    <span class="ranked-sets__content--highlight">{{ splitBeatmapCount[2] }}</span>
                </div>
            </div>

            <a
                v-if="phase && phase.phase === 'results'"
                class="vote-now"
                :class="`vote-now--${selectedMode}`"
                :href="`/${phase.year}/${phase.phase}`"
            >
                {{ $t(`mca.main.${buttonText}`) }} <span>>></span>
            </a>
            <a
                v-else-if="phase && phase.phase !== 'preparation' && isEligibleFor(selectedMode)"
                class="vote-now"
                :class="`vote-now--${selectedMode}`"
                :href="`/${phase.year}/${phase.phase}`"
            >
                {{ $t(`mca.main.${buttonText}`) }} <span>>></span>
            </a>
            <div
                v-else-if="phase && phase.phase !== 'preparation' && !isEligibleFor(selectedMode)"
                class="vote-now vote-now--inactive"
                :class="`vote-now--${selectedMode}`"
                @click="toggleGuestDifficultyModal"
            >
                {{ $t(`mca.main.${buttonText}`) }} <span>>></span>
            </div>
            <div v-else />
        </div>

        <div 
            v-if="mca" 
            class="categories"
        >
            <collapsible
                :title="$t('mca.main.categories.map')"
                :list="beatmapCategories"
                active
                category-name
                scroll
            />
            <collapsible
                :title="$t('mca.main.categories.user')"
                :list="userCategories"
                active
                category-name
                scroll
            />
        </div>
            
        <div 
            v-if="mca" 
            class="organizers"
        >
            <div class="organizers__title">
                <small>{{ $t('mca.main.organized') }}</small>
            </div>
            <div class="organizers__content">
                {{ organizers }}
            </div>
        </div>
        <div 
            v-else
            class="noMCA"
        >
            There is no MCA for {{ $route.params.year }} currently! Check back later!
            <div
                v-if="allMCA.length >= 1" 
                class="otherMCA"
            >
                Other MCAs:
                <div>
                    <nuxt-link 
                        v-for="mca in allMCA"
                        :key="mca.name"
                        :to="`/${mca.name}`"
                        :class="mca.phase"
                    >
                        MCA {{ mca.name }} ({{ mca.phase }}) 
                    </nuxt-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Getter, Mutation, State } from "vuex-class";

import Collapsible from "../../MCA-AYIM/components/Collapsible.vue";

import { MCA, MCAInfo, Phase } from "../../Interfaces/mca";
import { CategoryInfo } from "../../Interfaces/category";
import { UserMCAInfo } from "../../Interfaces/user";

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

    @State mca!: MCA;
    @State allMCA!: MCAInfo[];
    @State selectedMode!: string;
    @State loggedInUser!: UserMCAInfo;
    @Getter phase!: Phase | null;
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
            results: "viewResults",
        };
        return text[this.phase.phase];
    }

    get splitBeatmapCount (): RegExpExecArray | [] {
        const split = /(^0+)(\d+)/.exec(this.beatmapCount);

        return split || [];
    }

    async mounted () {
        if (this.mca) {
            const { data } = await this.$axios.get(`/api/mcaInfo/front?year=${this.mca.year}`);
            if (data.error) {
                alert(data.error);
                return;
            }

            this.info = data.frontData;
        }
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.index {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.general {
    @extend %spaced-container;
    margin: 0;
    flex: 1;
}

.categories {
    @extend %spaced-container;
    flex: 6;

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

.ranked-sets {
    @extend %flex-box;
    flex: 1 1 auto;
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
    flex: 1 1 auto;
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
        opacity: 0.5;
    }
    
    span {
        margin-left: 15px
    }
}

.organizers {
    @extend %flex-box;
    flex-direction: column;
    padding: 8px;
    flex: 1;

    &__title {
        border-bottom: 1px solid white;
    }

    &__content {
        padding: 25px;
    }
}

.noMCA {
    @extend %flex-box;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    height: 100%;

    font-size: 2rem;
}

.otherMCA {
    font-size: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    &__list {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
}

.nominating {
    color: $yellow;
}

.voting {
    color: $yellow;
}

.preparation {
    color: $red;
}

.results {
    color: $green;
}
</style>