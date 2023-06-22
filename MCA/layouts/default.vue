<template>
    <div class="layout layout--mca">
        <the-header 
            :site="'mca'"
            class="mcaayim__header"
        >
            <a 
                :href="`/${$route.params.year}`"
                @click="updateSelectedMode('')"
            >          
                <img
                    :src="require(`../../Assets/img/site/mca-ayim/year/${$route.params.year}-${viewTheme}-mca.png`)"
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

import TheHeader from "../../Assets/components/header/TheHeader.vue";
import ModeSwitcher from "../../Assets/components/mca-ayim/ModeSwitcher.vue";
import YearSwitcher from "../../Assets/components/mca-ayim/YearSwitcher.vue";
import TheFooter from "../../Assets/components/footer/TheFooter.vue";
import GuestDifficultyModal from "../../Assets/components/mca-ayim/GuestDifficultyModal.vue";

import { UserMCAInfo } from "../../Interfaces/user";

const mcaAyimModule = namespace("mca-ayim");

@Component({
    components: {
        TheHeader,
        ModeSwitcher,
        YearSwitcher,
        TheFooter,
        GuestDifficultyModal,
    },
    middleware: "mca",
})
export default class Default extends Vue {
    
    @State viewTheme!: "light" | "dark";
    @mcaAyimModule.State loggedInMCAUser!: null | UserMCAInfo;
    @mcaAyimModule.State selectedMode!: string;

    @mcaAyimModule.Action updateSelectedMode;

    isSmall = false;

    async mounted () {
        if (process.client) {
            this.isSmall = window.innerWidth < 576;
            window.addEventListener("resize", () => {
                this.isSmall = window.innerWidth < 576;
            });
        }

        await Promise.all([
            this.$store.dispatch("setViewTheme"),
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
