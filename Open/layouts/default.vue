<template>
    <div class="layout layout--open">
        <the-header
            class="header"
        >
            <a href="/">          
                <img
                    src="../../Assets/img/site/open/logo.png"
                    class="header__logo"
                    :class="`header__logo--${viewTheme}`"
                >
            </a>

            <div class="header__nav">
                <NuxtLink
                    to="/info"
                    class="header__nav-item"
                >
                    INFO
                </NuxtLink>
                <NuxtLink
                    to="/qualifiers" 
                    class="header__nav-item"
                >
                    QUALIFIERS
                </NuxtLink>
                <NuxtLink
                    to="/teams" 
                    class="header__nav-item"
                >
                    TEAMS
                </NuxtLink>
                <NuxtLink
                    to="/schedule" 
                    class="header__nav-item"
                >
                    SCHEDULE
                </NuxtLink>
                <NuxtLink
                    to="/mappool" 
                    class="header__nav-item"
                >
                    MAPPOOL
                </NuxtLink>
                <NuxtLink
                    to="/staff" 
                    class="header__nav-item"
                >
                    STAFF
                </NuxtLink>
            </div>
        </the-header>

        <nuxt 
            class="main" 
            :class="`main--${viewTheme}`"
        />
        
        <the-footer class="footer">
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
            <div 
                name="temp"
                style="width: 85%;"
            />
        </the-footer>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import TheHeader from "../../Assets/components/header/TheHeader.vue";
import TheFooter from "../../Assets/components/footer/TheFooter.vue";
import Tooltip from "../../Assets/components/footer/Tooltip.vue";

@Component({
    components: {
        TheHeader,
        TheFooter,
        Tooltip,
    },
    middleware: "index",
})
export default class Default extends Vue {
    
    @State viewTheme!: "light" | "dark";

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
        ]);
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.header {
    border-bottom: 1px solid $open-red;

    background-image: url("../../Assets/img/site/open/checkers.svg"), linear-gradient(0deg, #0F0F0F -32.92%, #2F2F2F 84.43%);
    background-repeat: no-repeat;
    background-position: left center;
    width: 100vw;
    position: relative;

    &__logo {
        padding-left: 6px;
        margin-top: 15px;
        @include breakpoint(tablet) {
            padding-left: 7px;
        }
        @include breakpoint(laptop) {
            padding-left: 9px;
        }
        @include breakpoint(desktop) {
            padding-left: 130px;
        }
    }

    &__nav {
        position:absolute;
        left:calc(50% - 20vw);
        display: flex;
        width: 40vw;
        justify-content: space-between;
        align-items: center;

        &-item {
            font-weight: 600;
            text-decoration: none;

            &:hover {
                color: $open-red;
                text-decoration: none;
            }

            &.nuxt-link-exact-active {
                color: $open-red;
                position: relative;
                display: inline-block;
            }

            &.nuxt-link-exact-active::after {
                content: "";
                position: absolute;
                left: calc(50% - 4.5px/2);
                bottom: -7px; 
                width: 4.5px;
                height: 4.5px;
                transform: rotate(-45deg);
                background-color: $open-red;
            }
        }
    }
}

.footer {
    border-top: 1px solid $open-red;
    background: linear-gradient(0deg, #0F0F0F -32.92%, #2F2F2F 84.43%);
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
    background-size: cover;
    overflow-x: hidden;
}
</style>
