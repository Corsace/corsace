<template>
    <div class="layout layout--mca-ayim">
        <DevBanner 
            v-if="devBanner"
            @close="devBanner = false"
        />
        <the-header
            class="mcaayim__header"
        >
            <!-- <a 
                :href="`/${$route.params.year}`"
                @click="updateSelectedMode('')"
            >          
                <img
                    :src="require(`../../Assets/img/site/mca-ayim/year/${$route.params.year}-${viewTheme}-ayim.png`)"
                    class="mcaayim__logo"
                    :class="`mcaayim__logo--${viewTheme}`"
                >
            </a>

            <mode-switcher 
                :enable-mode-eligibility="$route.name === 'year-stage'"
            /> -->
        </the-header>
        <div 
            class="main"
            :class="`main--${viewTheme}`"
        >
            <div 
                class="underConstruction"
                :class="`underConstruction--${viewTheme}`"
            >   
                <div class="underConstruction__header">
                    {{ $t(`main.construction.underConstruction`) }}
                </div>
                <div class="underConstruction__text">
                    Click below to navigate between years
                </div>
            </div>
        </div>

        <the-footer class="mcaayim__footer">
            <a 
                class="footer-nav__brand-name" 
                :class="`footer-nav__brand-name--${viewTheme}`"
                href="https://corsace.io"
            >
                <img
                    class="corsace__icon"
                    src="../../Assets/img/site/mca-ayim/corsace_text.png"
                    alt=""
                >
            </a>
            <div 
                class="socials"
                :class="`socials--${viewTheme}`"
            >
                <a
                    class="socials__link"
                    href="https://twitter.com/corsace_"
                    target="_blank"
                >
                    <img
                        class="socials__icon"
                        src="../../Assets/img/social/twitter.png"
                        alt=""
                    >
                </a>
                <a
                    class="socials__link"
                    href="https://discord.gg/Z6vEMsr"
                    target="_blank"
                >
                    <img
                        class="socials__icon"
                        src="../../Assets/img/social/discord.png"
                        alt=""
                    >
                </a>
                <a
                    class="socials__link"
                    href="https://www.twitch.tv/corsace"
                    target="_blank"
                >
                    <img
                        class="socials__icon"
                        src="../../Assets/img/social/twitch.png"
                        alt=""
                    >
                </a>
                <a
                    class="socials__link"
                    href="https://youtube.com/corsace"
                    target="_blank"
                >
                    <img
                        class="socials__icon"
                        src="../../Assets/img/social/youtube.png"
                        alt=""
                    >
                </a>
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
    },
    middleware: "mca",
})
export default class UnderConstruction extends Vue {

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
@import '@s-sass/_variables';

.underConstruction {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    text-align: center;
    color: rgb(191, 228, 243);
    
    &--light {
        mix-blend-mode: multiply;
    }
    &--dark {
        mix-blend-mode: difference;
    }

    &__header {
        text-transform: uppercase;
        font-size: calc(3 * $font-title);
        font-weight: bold;
    }

    &__text {
        font-size: $font-title;
    }
}
</style>