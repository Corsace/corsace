<template>
    <div class="layout layout--open">
        <DevBanner 
            v-if="devBanner"
            @close="hideBanner()"
        />
        <the-header
            class="header"
            :notif="teamInvites && teamInvites.length > 0"
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
                    to="/"
                    class="header__nav-item"
                >
                    {{ $t("open.navbar.home") }}
                </NuxtLink>
                <NuxtLink
                    to="/info"
                    class="header__nav-item"
                >
                    {{ $t("open.navbar.info") }}
                </NuxtLink>
                <NuxtLink
                    to="/qualifiers" 
                    class="header__nav-item"
                >
                    {{ $t("open.navbar.qualifiers") }}
                </NuxtLink>
                <NuxtLink
                    to="/teams" 
                    class="header__nav-item"
                >
                    {{ $t("open.navbar.teams") }}
                </NuxtLink>
                <NuxtLink
                    to="/schedule" 
                    class="header__nav-item"
                >
                    {{ $t("open.navbar.schedule") }}
                </NuxtLink>

                <NuxtLink
                    to="/mappool" 
                    class="header__nav-item"
                >
                    {{ $t("open.navbar.mappool") }}
                </NuxtLink>
                <NuxtLink
                    to="/staff" 
                    class="header__nav-item"
                >
                    {{ $t("open.navbar.staff") }}
                </NuxtLink>
            </div>
            <template #menu>
                <NuxtLink
                    v-if="staffInfo?.userRoles.includes(0) || staffInfo?.userRoles.includes(6)"
                    to="/referee"
                >
                    <MenuItem>{{ $t("open.navbar.referee").toString().toLowerCase() }}</MenuItem>
                </NuxtLink>
                <NuxtLink
                    to="/teams?s=my"
                >
                    <MenuItem>{{ $t("open.navbar.myTeams") }}</MenuItem>
                </NuxtLink>
                <NuxtLink
                    to="/team/invites"
                >
                    <MenuItem>
                        {{ $t("open.navbar.invitations") }}
                        <div
                            v-if="teamInvites && teamInvites.length > 0"
                            class="header__notification"
                        />
                    </MenuItem>
                </NuxtLink>
            </template>
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
                    {{ $t("open.footer.corsace") }}
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
                    {{ $t("open.footer.twitter") }}
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
                    {{ $t("open.footer.discord") }}
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
                    {{ $t("open.footer.twitch") }}
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
                    {{ $t("open.footer.youtube") }}
                </Tooltip>
                <Tooltip>
                    <template #icon>
                        <a
                            class="socials__link"
                            href="https://github.com/corsace/corsace"
                            target="_blank"
                        >
                            <img
                                class="socials__icon"
                                :class="`socials__icon--${viewTheme}`"
                                src="../../Assets/img/social/github.png"
                                alt=""
                            >
                        </a>
                    </template>
                    {{ $t("open.footer.github") }}
                </Tooltip>
                <Tooltip>
                    <template #icon>
                        <a
                            class="socials__link"
                            href="https://docs.google.com/spreadsheets/d/1f2538nh9McAii15EJkHU18fi65ICQihxsmvTK-qhA0w"
                            target="_blank"
                        >
                            <img
                                class="socials__icon"
                                :class="`socials__icon--${viewTheme}`"
                                src="../../Assets/img/social/sheets.png"
                                alt=""
                            >
                        </a>
                    </template>
                    {{ $t("open.footer.sheet") }}
                </Tooltip>
            </div>
        </the-footer>
    </div>
</template>

<script lang="ts">
import { Mixins, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";
import { ExtendedPublicationContext } from "centrifuge";
import CentrifugeMixin from "../../Assets/mixins/centrifuge";

import { UserInfo } from "../../Interfaces/user";
import { BaseTeam } from "../../Interfaces/team";
import { OpenStaffInfo } from "../../Interfaces/staff";

import DevBanner from "../../Assets/components/DevBanner.vue";
import TheHeader from "../../Assets/components/header/TheHeader.vue";
import TheFooter from "../../Assets/components/footer/TheFooter.vue";
import MenuItem from "../../Assets/components/header/MenuItem.vue";
import Tooltip from "../../Assets/components/Tooltip.vue";

const openModule = namespace("open");

@Component({
    components: {
        DevBanner,
        TheHeader,
        TheFooter,
        MenuItem,
        Tooltip,
    },
    middleware: "index",
})
export default class Default extends Mixins(CentrifugeMixin) {
    
    @State viewTheme!: "light" | "dark";
    @State loggedInUser!: null | UserInfo;

    @openModule.State teamInvites!: BaseTeam[] | null;
    @openModule.State staffInfo!: OpenStaffInfo | null;

    devBanner = false;
    isSmall = false;

    async mounted () {
        if (process.client) {
            this.isSmall = window.innerWidth < 576;
            window.addEventListener("resize", () => {
                this.isSmall = window.innerWidth < 576;
            });
        }

        await this.$store.dispatch("setViewTheme", "dark");
        
        // Get devBanner from localStorage, will be a number equivalent to Date.now() if it exists, if it doesn't exist, or if it's been past the value, then show the banner
        const devBannerTime = localStorage.getItem("devBanner");
        if (!devBannerTime || parseInt(devBannerTime) < Date.now())
            this.devBanner = true;

        if (!this.loggedInUser)
            return;

        await this.initCentrifuge(`invitations:${this.loggedInUser.ID}`);
    }

    handleData (ctx: ExtendedPublicationContext) {
        if (ctx.data.type === "invite")
            this.$store.commit("open/addInvite", ctx.data.team);
    }

    hideBanner () {
        localStorage.setItem("devBanner", (Date.now() + 604800000).toString());
        this.devBanner = false;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.layout--open {
    height: unset;
    min-height: 100%;
    overflow: hidden;
}

.header {
    border-bottom: 1px solid $open-red;
    background: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    width: 100vw;
    position: fixed;
    z-index: 2;
    
    @include breakpoint(desktop) {
        background-image: url("../../Assets/img/site/open/checkers.svg");
        background-repeat: no-repeat;
        background-position: left center;
    }

    &__notification {
        width: 8px;
        height: 8px;
        border-radius: 100%;
        background-color: $open-red;
    }

    &__logo {
        padding-left: 10px;
        margin-top: 16px;
        
        @include breakpoint(mobile) {
            scale: 50%;
        }

        @include breakpoint(desktop) {
            padding-left: 130px;
        }
    }

    &__nav {
        align-self: center;
        display: flex;
        gap: 12px;
        flex: 1;
        max-width: 1000px;
        justify-content: space-between;
        align-items: center;

        &-item {
            font-weight: 600;
            text-decoration: none;
            color: $open-red;

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
    position: fixed;
    z-index: 2;
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
        filter: brightness(100);
        @include breakpoint(tablet) {
            margin-right: 5px;
            height: 25px;   
        }
        @include breakpoint(laptop) {
            margin-right: 10px;
            height: 30px;   
        }
        // &--light {
        //     filter: invert(1);
        // }
        // &--dark {
        //     color: white;
        // }
    }
}

.main {
    background-size: cover;
    overflow-x: hidden;
    padding: 90px 0px 50px;

    @include breakpoint(mobile) {
        padding: 55px 0px 50px; // hardcoded for header breakpoint (sorry)
    }
}
</style>
