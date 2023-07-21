<template>
    <div class="layout layout--mca-ayim">
        <DevBanner 
            v-if="devBanner"
            @close="devBanner = false"
        />
        <the-header
            class="mcaayim__header"
        >
            <a 
                :href="`/${$route.params.year}`"
                @click="updateSelectedMode('')"
            >          
                <img
                    :src="require(`../../Assets/img/site/mca-ayim/year/${$route.params.year || 2023}-${viewTheme}-mca.png`)"
                    class="mcaayim__logo"
                    :class="`mcaayim__logo--${viewTheme}`"
                >
            </a>

            <mode-switcher 
                :enable-mode-eligibility="$route.name === 'year-stage'"
            />
        </the-header>

        <nuxt 
            class="main" 
            :class="`main--${viewTheme}`"
        />
        
        <the-footer class="mcaayim__footer">
            <div class="socials">
                <Tooltip>
                    <template #icon>
                        <a 
                            class="socials__link" 
                            href="https://corsace.io"
                            target="_blank"
                        >
                            <img
                                class="socials__icon"
                                :class="`socials__icon--${viewTheme}`"
                                src="../../Assets/img/corsace.png"
                                alt=""
                            >
                        </a>
                    </template>
                    CORSACE
                </Tooltip>
                <Tooltip>
                    <template #icon>
                        <a
                            class="socials__link"
                            href="https://twitter.com/corsace_"
                            target="_blank"
                        >
                            <img
                                class="socials__icon"
                                :class="`socials__icon--${viewTheme}`"
                                src="../../Assets/img/social/twitter.png"
                                alt=""
                            >
                        </a>
                    </template>
                    TWITTER
                </Tooltip>
                <Tooltip>
                    <template #icon>
                        <a
                            class="socials__link"
                            href="https://discord.gg/Z6vEMsr"
                            target="_blank"
                        >
                            <img
                                class="socials__icon"
                                :class="`socials__icon--${viewTheme}`"
                                src="../../Assets/img/social/discord.png"
                                alt=""
                            >
                        </a>
                    </template>
                    DISCORD
                </Tooltip>
                <Tooltip>
                    <template #icon>
                        <a
                            class="socials__link"
                            href="https://www.twitch.tv/corsace"
                            target="_blank"
                        >
                            <img
                                class="socials__icon"
                                :class="`socials__icon--${viewTheme}`"
                                src="../../Assets/img/social/twitch.png"
                                alt=""
                            >
                        </a>
                    </template>
                    TWITCH
                </Tooltip>
                <Tooltip>
                    <template #icon>
                        <a
                            class="socials__link"
                            href="https://youtube.com/corsace"
                            target="_blank"
                        >
                            <img
                                class="socials__icon"
                                :class="`socials__icon--${viewTheme}`"
                                src="../../Assets/img/social/youtube.png"
                                alt=""
                            >
                        </a>
                    </template>
                    YOUTUBE
                </Tooltip>
            </div>
            <year-switcher 
                v-if="!isSmall"
            />
        </the-footer>
        <year-switcher 
            v-if="isSmall"
        />
        <guest-difficulty-modal
            v-if="loggedInMCAUser"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import DevBanner from "../../Assets/components/DevBanner.vue";
import TheHeader from "../../Assets/components/header/TheHeader.vue";
import ModeSwitcher from "../../Assets/components/mca-ayim/ModeSwitcher.vue";
import YearSwitcher from "../../Assets/components/mca-ayim/YearSwitcher.vue";
import TheFooter from "../../Assets/components/footer/TheFooter.vue";
import Tooltip from "../../Assets/components/footer/Tooltip.vue";
import GuestDifficultyModal from "../../Assets/components/mca-ayim/GuestDifficultyModal.vue";

import { UserMCAInfo } from "../../Interfaces/user";

const mcaAyimModule = namespace("mca-ayim");

@Component({
    components: {
        DevBanner,
        TheHeader,
        ModeSwitcher,
        YearSwitcher,
        TheFooter,
        GuestDifficultyModal,
        Tooltip,
    },
    middleware: "mca",
})
export default class Default extends Vue {
    
    @State viewTheme!: "light" | "dark";
    @mcaAyimModule.State loggedInMCAUser!: null | UserMCAInfo;
    @mcaAyimModule.State selectedMode!: string;

    @mcaAyimModule.Action updateSelectedMode;

    devBanner = true;
    isSmall = false;

    async mounted () {
        if (process.client) {
            this.isSmall = window.innerWidth < 576;
            window.addEventListener("resize", () => {
                this.isSmall = window.innerWidth < 576;
            });
        }

        await Promise.all([
            this.$store.dispatch("setViewTheme", "light"),
            this.$store.dispatch("mca-ayim/setSelectedMode"),
        ]);
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.mcaayim {
    &__header {
        border-bottom: 1px solid $blue;
    }

    &__logo {
        align-self: center;

        width: 150px;
        padding-left: 6px;
        @include breakpoint(tablet) {
            width: 180px;
            padding-left: 7px;
        }
        @include breakpoint(laptop) {
            width: 225px;
            padding-left: 9px;
        }
        @include breakpoint(desktop) {
            width: 260px;
            padding-left: 10px;
        }
    }

    &__footer {
        border-top: 1px solid $blue;
    }
}

.footer-nav {
    &__brand {

        &-name {
            display: flex;
            align-items: center;
            justify-content: center;
            &--light {
                filter: invert(1);
            }
        }
    }
}

.socials {
    height: 100%;
    display: flex;
    align-items: center;
    @include breakpoint(mobile) {
        margin-right: auto;
    }
    @include breakpoint(laptop) {
        margin-left: 20px;
    }

    &__link {
        display: flex;
    }

    &__icon {
        margin-right: 3px;
        height: 20px;
        @include breakpoint(tablet) {
            margin-right: 5px;
            height: 25px;   
        }
        @include breakpoint(laptop) {
            margin-right: 10px;
            height: 30px;   
        }
        &--light {
            filter: invert(1);
        }
        &--dark {
            color: white;
        }
    }
}

.main {
    overflow: hidden;
    &--light {
        background-color: white;
        background-image: url("../../Assets/img/site/mca-ayim/grid-light.jpg");
        background-size: cover;
    }
    &--dark {
        background-color: $darker-gray;
        background-image: url("../../Assets/img/site/mca-ayim/grid-dark.jpg");
        background-size: cover;
    }
}
</style>
