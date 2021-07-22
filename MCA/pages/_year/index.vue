<template>
    <div>
        <div
            v-if="phase"
            class="left-side"
        >
            <div class="voting-date">
                <div
                    v-if="phase.phase === 'nominating' || phase.phase === 'voting'" 
                    class="voting-date__wheel-container"
                >
                    <div class="voting-date__wheel-img" />

                    <div class="voting-date__wheel-box" />

                    <div class="voting-date__content">
                        <div class="voting-date__title">
                            <b>{{ $t(`mca.main.stage.${phase.phase}`) }}</b>
                        </div>
                        <div class="voting-date__subtitle">
                            <!-- Only show on mobile instead of wheel -->
                            <div class="voting-date__days">
                                {{ remainingDays }}
                            </div>
                            {{ $t('mca.main.daysLeft') }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="general-info">
                <p v-if="phase.phase">
                    <span :class="phase.phase === 'nominating' ? `general-info--${selectedMode}` : ''">
                        {{ $t(`mca.main.nominating`).toUpperCase() + " | " + mca.nomination.start.toLocaleString(dateInfo.locale, options) + " - " + mca.nomination.end.toLocaleString(dateInfo.locale, options) }}
                    </span>
                    <br>
                    <span :class="phase.phase === 'voting' ? `general-info--${selectedMode}` : ''">
                        {{ $t(`mca.main.voting`).toUpperCase() + " | " + mca.voting.start.toLocaleString(dateInfo.locale, options) + " - " + mca.voting.end.toLocaleString(dateInfo.locale, options) }}
                    </span>
                    <br>
                    <span :class="phase.phase === 'results' ? `general-info--${selectedMode}` : ''">
                        {{ $t(`mca.main.results`).toUpperCase() + " | " + mca.results.toLocaleString(dateInfo.locale, options) }}
                    </span>
                </p>
                <div v-html="$t(`mca.main.message.${$route.params.year}`)" />
            </div>
        </div>

        <div :class="{'right-side': phase, 'full-side': !phase}">
            <mode-switcher 
                hide-phase
            >
                <index-page />
            </mode-switcher>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Getter, State } from "vuex-class";

import ModeSwitcher from "../../../MCA-AYIM/components/ModeSwitcher.vue";
import IndexPage from "../../components/IndexPage.vue";

import { MCA, Phase } from "../../../Interfaces/mca";

@Component({
    components: {
        ModeSwitcher,
        IndexPage,
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

    @State mca!: MCA;
    @State selectedMode!: string;

    @Getter phase!: Phase;

    dateInfo = Intl.DateTimeFormat().resolvedOptions();
    options: Intl.DateTimeFormatOptions = { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, timeZoneName: "short", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" };

    mounted () {
        let days = 0;

        if (this.remainingDays > 31) {
            days = 32; // 31
        } else if (this.remainingDays <= 0) {
            days = 1; // 00
        } else {
            days = this.remainingDays + 1;
        }
        const wheel: HTMLElement | null = document.querySelector(".voting-date__wheel-img");

        if (wheel) {
            wheel.style["transform"] = `rotate(${(360 / 32) * days}deg)`;
        }
    }

    get remainingDays (): number {
        return Math.floor((this.phase?.endDate?.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    }

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.left-side {
    overflow: hidden;
    padding-right: 0;
    padding-top: 7%;
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: flex-end;
    flex: 0 0 100%;
    width: 100%;

    @include breakpoint(mobile) {
        margin-bottom: 0;
    }

    @include breakpoint(laptop) {
        padding-right: 35px;
    }
}

.voting-date {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    margin-bottom: 40px;
    width: 100%;

    &__wheel-container {
        display: flex;
        width: 100%;
        position: relative;
    }

    &__wheel-img {
        display: none;
        width: 965px;
        height: 965px;
        background: url("../../../Assets/img/ayim-mca/site/wheel.png") no-repeat center;
        background-size: cover;
        left: -730px;
        top: -400px;
        position: absolute;
        z-index: -1;
    }

    &__wheel-box {
        display: none;
        box-shadow: inset 0 0 20px 0px #222;
        border: 3px solid rgba(0, 0, 0, 0.3);
        border-radius: 15px;
        border-bottom: 2px solid white;
        border-right: 2px solid white;
        width: 220px;
        height: 150px;
        flex: 0 0 220px;
        margin-left: 35px;
    }

    &__content {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        flex-wrap: nowrap;
    }

    &__title {
        font-size: 2rem;
        border-bottom: 3px solid white;
        width: 100%;
        text-align: right;
    }

    &__subtitle {
        font-family: 'Lexend Peta';
        font-size: 4.5rem;
        text-align: right;
        letter-spacing: -8.96px;
    }

    &__days {
        display: inline-block;
    }

    @include breakpoint(tablet) {
        &__wheel-img, &__wheel-box {
            display: block;
        }

        &__days {
            display: none;
        }
    }
}

.general-info {
    border-radius: 0 15px 15px 0; 
    background-color: rgba(0, 0, 0, 0.8); 
    padding: 45px 30px;

    width: 100%;
    display: flex;
    flex-direction: column;

    & > p, &--header {
        text-align: center;
    }

    &--header {
        font-size: 2rem;
    }

    @each $mode in $modes {
        &--#{$mode} {
            color: var(--#{$mode});
            font-weight: bold;
            text-shadow: 0 0 8px var(--#{$mode});
            @include transition;
        }
    }
}

.right-side {
    flex: 0 0 100%;
    width: 100%;
    padding-top: 50px;
}

.full-side {
    width: 100%;
}

@include breakpoint(laptop) {
    .left-side, .right-side {
        flex: 0 0 50%;
        max-width: 50%;
    }
}

</style>