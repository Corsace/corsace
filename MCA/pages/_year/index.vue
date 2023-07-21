<template>
    <div>
        <div
            v-if="selectedMode && phase"
            class="index scroll__mca index__main"
            :class="[
                `index--${viewTheme}`,
                `scroll--${viewTheme}`
            ]"
        >
            <mode-header />
            <div class="index__modeInfo">
                <div
                    class="index__modeInfo--time"
                    :class="`index__modeInfo--time-${viewTheme}`"
                >
                    <div 
                        class="index__modeInfo--time-topBorder"
                        :class="`index__modeInfo--time-topBorder-${viewTheme}`"
                    >
                        {{ $t(`mca.main.stage.stage`) }}
                        <div :class="`index__modeInfo--time-line${viewTheme}`" />
                        <div class="index__modeInfo--time-stage">
                            {{ $t(`mca.main.${phase.phase}`).split("").join(" ").toUpperCase() }}
                        </div>
                    </div>
                    
                    <div 
                        class="index__modeInfo--time-text"
                        :class="`index__modeInfo--time-text-${viewTheme}`"
                    >
                        <div class="index__modeInfo--time-textNumber">
                            {{ phase.phase === 'nominating' || phase.phase === 'voting' ? remainingDays : "00" }}
                        </div>
                        <div class="index__modeInfo--time-textLine" />
                        {{ $t('mca.main.daysLeft').toUpperCase() }}
                    </div>

                    <div class="index__modeInfo--time-bottomBorder" />

                    <div class="index__modeInfo--time-superBottomBorder" />
                </div>
                <div 
                    class="index__modeInfo--info"
                    :class="`index__modeInfo--info-${viewTheme}`"
                >
                    <div class="index__modeInfo--timeline">
                        <div class="index__mainHeader">
                            {{ $t("mca.main.timeline").toUpperCase() }}
                        </div>
                        <div class="index__modeInfo--timeline-phase">
                            <div 
                                class="index__modeInfo--timeline-stage"
                                :class="phase.phase === 'nominating' ? [
                                    `index__modeInfo--${selectedMode}`,
                                    `index__modeInfo--${selectedMode}-${viewTheme}`
                                ] : ''"
                            >
                                {{ $t(`mca.main.nominating`).toUpperCase() }}
                            </div>
                            <div 
                                class="index__modeInfo--timeline-dot"
                                :class="phase.phase === 'nominating' ? `index__modeInfo--timeline-dot-${selectedMode}` : ''"
                            />
                            {{ mca.nomination.start.toLocaleString(dateInfo.locale, options) + " -" }} 
                            <br>
                            {{ mca.nomination.end.toLocaleString(dateInfo.locale, options) }}
                        </div>
                        <div class="index__modeInfo--timeline-phase">
                            <div 
                                class="index__modeInfo--timeline-stage"
                                :class="phase.phase === 'voting' ? [
                                    `index__modeInfo--${selectedMode}`,
                                    `index__modeInfo--${selectedMode}-${viewTheme}`
                                ] : ''"
                            >
                                {{ $t(`mca.main.voting`).toUpperCase() }}
                            </div>
                            <div 
                                class="index__modeInfo--timeline-dot"
                                :class="phase.phase === 'voting' ? `index__modeInfo--timeline-dot-${selectedMode}` : ''"
                            />
                            {{ mca.voting.start.toLocaleString(dateInfo.locale, options) + " -" }} 
                            <br>
                            {{ mca.voting.end.toLocaleString(dateInfo.locale, options) }}
                        </div>
                        <div class="index__modeInfo--timeline-phase">
                            <div 
                                class="index__modeInfo--timeline-stage"
                                :class="phase.phase === 'results' ? [
                                    `index__modeInfo--${selectedMode}`,
                                    `index__modeInfo--${selectedMode}-${viewTheme}`
                                ] : ''"
                            >
                                {{ $t(`mca.main.results`).toUpperCase() }}
                            </div>
                            <div 
                                class="index__modeInfo--timeline-dot"
                                :class="phase.phase === 'results' ? `index__modeInfo--timeline-dot-${selectedMode}` : ''"
                            />
                            {{ mca.results.toLocaleString(dateInfo.locale, options) }}
                            <br>
                            <br>
                        </div>
                    </div>
                    <div class="index__modeInfo--organizers">
                        <div class="index__mainHeader">
                            {{ $t('mca.main.organized') }}
                        </div>
                        <div class="index__modeInfo--organizers-list">
                            {{ organizers }}
                        </div>
                    </div>
                </div>
                <div 
                    class="index__modeInfo--categories"
                    :class="`index__modeInfo--categories-${viewTheme}`"
                >
                    <div class="index__mainHeader">
                        {{ $t('mca.main.categories.index') }}
                    </div>
                    <div 
                        class="index__setCount"
                        :class="`index__setCount--${viewTheme}`"
                    >
                        {{ $t('mca.main.rankedSets') }}
                        <div 
                            class="index__setCount--counter"
                            :class="`index__setCount--counter-${viewTheme}`"
                        >
                            <div
                                v-for="i in 5"
                                :key="i"
                                class="index__setCount--number"
                                :class="`index__setCount--number-${viewTheme}`"
                            >
                                {{ countString.length > (i - 1) ? countString[i - 1] : "" }}
                            </div>
                        </div>
                    </div>
                    <a
                        v-if="phase.phase !== 'preparation' && loggedInMCAUser && (phase.phase === 'results' || isEligibleFor(selectedMode))"
                        class="index__navigation"
                        :class="`index__navigation--${viewTheme} index__navigation--${selectedMode} index__navigation--${selectedMode}-${viewTheme}`" 
                        :href="`/${phase.year}/${phase.phase}`"
                    >
                        {{ $t(`mca.main.${phaseText}`) }}
                    </a>
                    <div
                        v-else-if="phase.phase !== 'preparation' && loggedInMCAUser && !isEligibleFor(selectedMode)"
                        class="index__navigation index__navigation--inactive"
                        :class="`index__navigation--inactive-${viewTheme} index__navigation--${viewTheme}-inactive`"
                        @click="toggleGuestDifficultyModal"
                    >
                        {{ $t(`mca.main.${phaseText}`) }}
                    </div>
                    <div class="index__modeInfo--categories-line" />
                    <div class="index__categories">
                        <collapsible
                            :title="$t('mca.main.categories.map').toUpperCase()"
                            :list="beatmapCategories"
                            active
                            category-name
                            scroll
                        />
                        <collapsible
                            :title="$t('mca.main.categories.user').toUpperCase()"
                            :list="userCategories"
                            active
                            category-name
                            scroll
                        />
                    </div>
                </div>
            </div>
        </div>
        <div
            v-else-if="!selectedMode"
            class="index scroll__mca index__bg"
            :class="[
                `index--${viewTheme}`,
                `scroll--${viewTheme}`
            ]"
        >
            <a
                href="https://ayim.corsace.io" 
                class="portal__ayim"
            >
                <div :class="`portal__ayim--container portal--${viewTheme} portal__ayim--container--${viewTheme}`">
                    <div 
                        class="portal__ayim--offset"
                        :class="`index--${viewTheme}`"
                    >
                        <span v-html="$t('mca.main.banner')" /> {{ $route.params.year }}
                    </div>
                    <div class="portal__ayim--right">
                        <img
                            :src="require(`../../../Assets/img/site/mca-ayim/year/${$route.params.year || 2023}-${viewTheme}-mca.png`)" 
                        >
                        <div class="portal__desc--right">
                            {{ $t('mca.main.click') }}
                        </div>
                    </div>
                </div>
            </a>
            <div class="portal__other">
                <a 
                    href="https://shop.corsace.io"
                    class="portal__shop"
                    :class="`portal--${viewTheme}`"
                >
                    <div class="portal__link">
                        shop.<span class="bold">corsace</span>.io
                    </div>
                    <div class="portal__desc">
                        {{ $t('mca_ayim.banner.merch') }}
                    </div>
                </a>
                <a 
                    href="https://corsace.io"
                    class="portal__main"
                    :class="`portal--${viewTheme}`"
                >
                    <div class="portal__link">
                        <span class="bold">corsace</span>.io
                    </div>
                    <div class="portal__desc">
                        {{ $t('mca_ayim.banner.corsace') }}
                    </div>
                </a>
            </div>
            <hr class="dividerMain">
            <div class="welcomeBack">
                <div>
                    <span v-html="$t('mca.main.welcome')" />
                </div>
            </div>
            <div class="textBody">
                <span v-html="$t('mca.main.message.2022')" />
            </div>
            <br>
        </div>
        <div 
            v-else
            class="index__noMCA index__bg"
            :class="`index--${viewTheme}`"
        >
            <div>
                No MCA currently for {{ $route.params.year }}
            </div>
            <div>
                Click below to navigate between years
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import { CategoryInfo } from "../../../Interfaces/category";
import { MCA, MCAPhase } from "../../../Interfaces/mca";
import { UserMCAInfo } from "../../../Interfaces/user";

import Collapsible from "../../../Assets/components/mca-ayim/Collapsible.vue";
import ModeHeader from "../../../Assets/components/mca-ayim/ModeHeader.vue";

const mcaAyimModule = namespace("mca-ayim");

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
        ModeHeader,
        Collapsible,
    },
    head () {
        return {
            title: `Mappers' Choice Awards ${this.$route.params.year ?? (new Date()).getUTCFullYear()}`,
            meta: [
                { hid: "description", name: "description", content: "Mappers' Choice Awards is the osu!-related awards event for ranked mappers and members of the mapping community to decide what the beatmaps and who the best users were each year." },
                { hid: "og:title", property: "og:title", content: `Mappers' Choice Awards ${this.$route.params.year ?? (new Date()).getUTCFullYear()}` },
                { hid: "og:type", property: "og:type", content: "website" },
                { hid: "og:url", property: "og:url", content: "https://mca.corsace.io" },
                { hid: "og:description", property: "og:description", content: "Mappers' Choice Awards is the osu!-related awards event for ranked mappers and members of the mapping community to decide what the beatmaps and who the best users were each year." },
                { hid: "og:site_name", property: "og:site_name", content: "MCA" },
                { hid: "theme-color", name: "theme-color", content: "#fb2475" },
            ],
        };
    },
})
export default class Index extends Vue {

    @mcaAyimModule.State loggedInMCAUser!: null | UserMCAInfo;
    @mcaAyimModule.State mca!: MCA;
    @mcaAyimModule.State selectedMode!: string;
    @mcaAyimModule.Getter phase!: MCAPhase | null;
    @mcaAyimModule.Getter isEligibleFor!: (mode: string) => boolean;
    @mcaAyimModule.Mutation toggleGuestDifficultyModal!: boolean;

    @State viewTheme!: "light" | "dark";

    dateInfo = Intl.DateTimeFormat().resolvedOptions();
    options: Intl.DateTimeFormatOptions = { timeZone: this.dateInfo.timeZone, timeZoneName: "short", month: "long", day: "numeric", hour: "numeric", minute: "numeric" };

    info: FullFrontInfo | null = null;

    countString = ["0"];

    easingIterations = 20;
    easing (easingVal) {
        return easingVal * (2 - easingVal);
    }

    get remainingDays (): number {
        return Math.floor((this.phase?.endDate?.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    }

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

    get beatmapCount (): number {
        return this.currentModeInfo ? this.currentModeInfo.beatmapCount : 0;
    }

    @Watch("beatmapCount")
    onPropertyChanged (newVal: number, oldVal: number) {
        var i = 1;
        var timer = setInterval(() => {
            const val = Math.round(oldVal + (newVal - oldVal) * this.easing(i / this.easingIterations));
            this.countString = val.toString().split("").reverse();
            i++;
            if (i > this.easingIterations)
                clearInterval(timer);
        }, 10);
    }
    
    get organizers (): string {
        return this.currentModeInfo?.organizers.join(", ") || "";
    }

    get phaseText (): string {
        if (!this.phase) return "";

        const text = {
            nominating: "nominateNow",
            voting: "voteNow",
            results: "viewResults",
        };
        return text[this.phase.phase];
    }

    async mounted () {
        if (this.mca) {
            const { data } = await this.$axios.get(`/api/mca/front?year=${this.mca.year}`);
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
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.index {
    &__bg {
        background-image: url("../../../Assets/img/site/mca-ayim/home-bg.png");
        background-position: center;
        background-repeat: repeat-y;
        background-attachment: local;
        background-size: 100%;
    }

    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 20px;

    @include breakpoint(mobile) {
        margin-top: 55px;
    }

    font-size: $font-base;
    @include breakpoint(tablet) {
        font-size: $font-xl;
    }
    @include breakpoint(laptop) {
        font-size: $font-xxl;
    }
    @include breakpoint(desktop) {
        font-size: $font-xxxl;
    }
    &--light {
        color: black;
    }
    &--dark {
        color: white;
    }

    height: 100%;

    &__main {
        font-size: $font-sm;
        @include breakpoint(tablet) { 
            font-size: $font-base;
        }
        @include breakpoint(laptop) { 
            font-size: $font-lg;
        }
        @include breakpoint(desktop) { 
            font-size: $font-xl;
        }
        padding: 20px 50px;
    }

    &__navigation {

        width: 75%;
        align-self: center;

        display: flex;
        justify-content: center;
        align-items: center;

        padding: 10px;
        margin-bottom: 25px;

        border: 1px $blue solid;
        border-radius: 3px;

        &--light {
            background-color: white;
            &-inactive {
                border: 1px rgba(0,0,0,0.5) solid;
            }
        }
        &--dark {
            background-color: $dark;
            &-inactive {
                border: 1px rgba(255,255,255,0.5) solid;
            }
        }

        @each $mode in $modes {
            &--#{$mode} {
                color: var(--#{$mode});
                &-light {
                    &:hover {
                        color: white;
                        background-color: var(--#{$mode});
                        text-decoration: none;
                    }
                }
                &-dark {
                    &:hover {
                        color: $dark;
                        background-color: var(--#{$mode});
                        text-decoration: none;
                    }
                }
            }
        }

        &--inactive {
            cursor: pointer;

            &-light {
                color: rgba(0,0,0,0.5);
                background-color: rgba(0,0,0,0.5);
            }
            &-dark {
                color: rgba(255,255,255,0.5);
                background-color: rgba(255,255,255,0.5);
            }
        }
    }

    &__modeInfo {
        flex: 1;
        display: flex;
        justify-content: space-evenly;
        flex-wrap: wrap;
        gap: 50px;

        width: 100%;

        &--time, &--info, &--categories {
            border: 1px $blue solid;

            display: flex;
            flex-direction: column;

            &-light {
                background-color: white;
            }
            &-dark {
                background-color: $dark;
            }
        }

        &--time, &--info {
            flex: 1;
        }

        &--info, &--categories {
            padding: 20px;
        }

        &--time {

            &-stage {
                font-weight: bold;
                width: 100%;
                text-align: center;
                text-align-last: justify;
                white-space: nowrap;
            }

            &-text {
                position: relative;
                padding: 20px;

                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;

                font-weight: bold;
                color: $blue;

                &-light {
                    &::after {
                        content: "";
                        display: block;
                        position: absolute;
                        width: 100%;
                        bottom: -20px;
                        height: 20px;
                        background: linear-gradient(-45deg, transparent 75%, white 0) 0 50%,
                                    linear-gradient(45deg, transparent 75%, white 0) 0 50%;
                        background-size: 20px 20px;
                        z-index: 1;
                    }
                }
                &-dark {
                    &::after {
                        content: "";
                        display: block;
                        position: absolute;
                        width: 100%;
                        bottom: -20px;
                        height: 20px;
                        background: linear-gradient(-45deg, transparent 75%, $dark 0) 0 50%,
                                    linear-gradient(45deg, transparent 75%, $dark 0) 0 50%;
                        background-size: 20px 20px;
                        z-index: 1;
                    }
                }

                &Line {
                    border: 1px $blue solid;
                    width: 75%;
                }

                &Number {
                    font-size: 13rem;
                    font-weight: normal;
                    line-height: 14rem;
                }
            }

            &-line {
                border: 1px solid $blue;
            }
            &-linelight {
                border: 1px solid white;
                width: 75%;
            }
            &-linedark {
                border: 1px solid $dark;
                width: 75%;
            }

            &-topBorder {
                &-light {
                    color: white;
                }
                &-dark {
                    color: $dark;
                }

                &::after {
                    content: "";
                    display: block;
                    position: absolute;
                    width: 100%;
                    bottom: -20px;
                    height: 20px;
                    background: linear-gradient(-45deg, transparent 75%, $blue 0) 0 50%,
                                linear-gradient(45deg, transparent 75%, $blue 0) 0 50%;
                    background-size: 20px 20px;
                }

                position: relative;

                display: flex;
                align-items: center;
                justify-content: center;
                flex-wrap: wrap;
                column-gap: 10px;

                padding: 20px;
                background-color: $blue;
            }

            &-bottomBorder {
                position: relative;
                background-image: url("../../../Assets/img/site/mca-ayim/fractal.png");
                background-position: right;
                background-size: 125%;
                height: 100%;
            }

            &-superBottomBorder {
                position: relative;
                background-color: $blue;
                height: 100px;

                &::before {
                    content: "";
                    display: block;
                    position: absolute;
                    width: 100%;
                    top: -20px;
                    height: 20px;
                    background: linear-gradient(-45deg, transparent 75%, $blue 0) 0 50%,
                                linear-gradient(45deg, transparent 75%, $blue 0) 0 50%;
                    background-size: 20px 20px;
                    transform: rotate(180deg);
                }
            }
        }

        &--info {
            gap: 75px;
        }

        &--timeline {
            font-size: $font-base;

            &-dot {
                position: absolute;
                right: -5px;
                top: 43%;

                height: 10px;
                width: 10px;

                background-color: $blue;

                border-radius: 50%;

                @each $mode in $modes {
                    &-#{$mode} {
                        height: 12px;
                        width: 12px;
                        border: 2px solid var(--#{$mode});
                    }
                }
            }

            &-phase {
                position: relative;

                display: flex;
                flex-direction: column;
                justify-content: center;
                
                text-align: right;
                white-space: nowrap;

                margin-left: 20px;
                padding: 25px 0;
                border-left: 2px dashed $blue;
            }

            &-stage {
                color: $gray;
                font-size: $font-xxl;
                border-bottom: 2px dashed $blue;
            }
        }

        @each $mode in $modes {
            &--#{$mode} {
                color: var(--#{$mode});
                &-dark {
                    text-shadow: 0 0 2px var(--#{$mode});
                }
            }
        }

        &--organizers {

            &-list {
                font-size: $font-xl;
                color: #808080;
                text-align: center;
            }
        }

        &--categories {
            flex: 2;
            text-transform: uppercase;

            &-line {
                width: 100%;
                border: 1px solid $blue;
                margin-bottom: 20px;
            }
        }
    }

    &__mainHeader {
        font-weight: bold;
        font-size: $font-base;
        @include breakpoint(tablet) { 
            font-size: $font-lg;
        }
        @include breakpoint(laptop) { 
            font-size: $font-xl;
        }
        @include breakpoint(desktop) { 
            font-size: $font-xxl;
        }

        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 60%;

        border-bottom: 2px $blue solid;
    }

    &__categories {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;

        &--map, &--user {
            flex: 1;

            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
    }

    &__setCount {
        align-self: center;

        display: flex;
        justify-content: space-between;
        align-items: center;

        font-weight: bold;

        width: 75%;

        margin: 25px 0;
        padding: 20px 50px;
        border-radius: 15px;
        background-color: $blue;

        &--light {
            color: white;
        }
        &--dark {
            color: black;
        }

        &--counter {
            display: flex;
            gap: 10px;
            flex-direction: row-reverse;
            &-light {
                color: $gray;
            }
            &-dark {
                color: white;
            }
        }

        &--number {
            padding: 10px;
            border-radius: 15px;

            font-size: 5rem;
            font-weight: normal;

            height: 100px;
            width: 3rem;

            display: flex;
            justify-content: center;
            align-items: center;

            &-light {
                background-color: white;
            }
            &-dark {
                background-color: $dark;
            }
        }
    }

    &__noMCA {
        height: 100%;

        @include breakpoint(mobile) {
            font-size: $font-xl;
        }
        font-size: $font-xxl;
        @include breakpoint(tablet) {
            font-size: $font-xxxl;
        }
        @include breakpoint(desktop) {
            font-size: $font-title;
        }

        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: center;
    }
}

.portal {
    &--light {
        background-color: white;
    }
    &--dark {
        background-color: $dark;
    }
    &--light, &--dark {
        color: $alt-blue;
        border: 1px $blue solid; 
    }

    &__ayim {
        width: 75vw;
        margin: 50px 0;
        @include breakpoint(laptop) {
            margin: 60px 0px 5px 0px;
        }
        padding: 0 25px;

        &:hover {
            text-decoration: none;
        }

        &--container {
            display: flex;
            align-items: center;
            justify-content: space-between;

            position: relative; 
            &--light{
                background-image: url("../../../Assets/img/site/mca-ayim/light-blue-line.png");
            }
            &--dark{
                background-image: url("../../../Assets/img/site/mca-ayim/dark-blue-line.png");
            }
            background-repeat: no-repeat;
            background-position-y: 5%;
            background-position-x: 33%;
        }
        
        /* lets look back at 2022*/
        &--offset {

            @include breakpoint(mobile) {
                left: 0;
                right: 0;
                top: -3rem;
            }
            left: calc(-1 * $font-title-large/2);
            
            @include breakpoint(mobile) {
                width: 100%;
            }
            width: calc(3 * $font-xl);
            @include breakpoint(tablet) {
                width: calc(3 * $font-xxl);
                margin-left: calc(1 * $font-title-large);
            }
            @include breakpoint(laptop) {
                width: calc(3 * $font-xxxl);
                margin-left: calc(1 * $font-title-large);
            }
            @include breakpoint(desktop) {
                font-size: $font-title-large;
                width: calc(5 * $font-title-large);
                margin-left: calc(1 * $font-title-large);
                line-height: 4rem;
                letter-spacing: 3px;
            }
            line-height: 2.5rem;
            letter-spacing: 3px;
            margin-bottom: 15px;

            font-style: italic;
            font-weight: bold;

        }
        /* old */
        &--centre {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;

            padding: 15px 0;

            & > img {
                @include breakpoint(mobile) {
                    height: 40px;
                }
                height: 70px;
                margin: 25px 0;
            }
        }
        /* logo new */
        &--right {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;

            padding: 15px 0;

            & > img {
                @include breakpoint(mobile) {
                    height: 40px;
                }
                height: 70px;
                margin-top: 25px;
                margin-bottom: 25px;
                /* desktop */
                margin-right: calc(1 * $font-title);
            }
        }
    }

    &__desc {
        font-size: $font-xsm;
        @include breakpoint(laptop) {
            font-size: $font-sm;
        }
        @include breakpoint(desktop) {
            font-size: $font-base;
        }
        font-weight: bold;
        text-align: center;

        &--right {
            font-size: $font-xsm;
            @include breakpoint(laptop) {
                font-size: $font-sm;
            }
            @include breakpoint(desktop) {
                font-size: $font-base;
            }
        display: flex;
        font-weight: bold;
        margin-left: auto; 
        /* desktop */
        margin-right: calc(1 * $font-title);;
        }
    }

    &__link {
        font-family: "CocoGoose Pro", 'sans-serif';
        font-size: $font-lg;
        line-height: $font-lg;
        text-align: center;
        @include breakpoint(laptop) {
            font-size: $font-xl;
            line-height: $font-xl;
        }
        @include breakpoint(desktop) {
            font-size: $font-xxxl;
            line-height: $font-xxxl;
        }

        margin: 15px;
    }

    &__other {
        display: flex;
        justify-content: center;
        align-items: center;
        @include breakpoint(mobile) {
            flex-direction: column;
        }

        width: 75vw;
        & a {

            flex: 1;
            @include breakpoint(mobile) {
                margin: 25px 0;
                width: 100%;
            }
            margin: 0 25px;
            padding: 10px 20px;
            @include breakpoint(desktop) {
                padding: 15px 45px;
            }

            &:hover {
                text-decoration: none;
            }
        }
    }
}

.welcomeBack {
    font-weight: bold;
    line-height: $font-xl;
    @include breakpoint(tablet) {
        line-height: $font-xxl;
    }
    @include breakpoint(laptop) {
        line-height: $font-xxxl;
    }
    @include breakpoint(desktop) {
        line-height: $font-title;
    }
}

.dividerMain {
    border: 1px solid $blue;
    width: 15vw;
}

.textBody {
    font-size: $font-xl;
    line-height: $font-xl;
    width: 70vw;
    text-align: center;
    @include breakpoint(tablet) {
        line-height: $font-xxl;
    }
    @include breakpoint(laptop) {
        line-height: $font-xxxl;
    }
    @include breakpoint(desktop) {
        line-height: $font-title;
    }
}

.nominating {
    text-shadow: -1px -1px 0 $dark, 1px -1px 0 $dark, -1px 1px 0 $dark, 1px 1px 0 $dark;
    color: $yellow;
}

.voting {
    text-shadow: -1px -1px 0 $dark, 1px -1px 0 $dark, -1px 1px 0 $dark, 1px 1px 0 $dark;
    color: $yellow;
}

.preparation {
    text-shadow: -1px -1px 0 $dark, 1px -1px 0 $dark, -1px 1px 0 $dark, 1px 1px 0 $dark;
    color: $red;
}

.results {
    text-shadow: -1px -1px 0 $dark, 1px -1px 0 $dark, -1px 1px 0 $dark, 1px 1px 0 $dark;
    color: $green;
}
</style>