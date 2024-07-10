<template>
    <div class="layout layout--open">
        <DevBanner 
            v-if="devBanner"
            @close="devBanner = false"
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
            <div 
                name="temp"
                style="width: 79%;"
            />
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

    devBanner = true;
    isSmall = false;

    async mounted () {
        if (process.client) {
            this.isSmall = window.innerWidth < 576;
            window.addEventListener("resize", () => {
                this.isSmall = window.innerWidth < 576;
            });
        }

        await this.$store.dispatch("setViewTheme", "dark");

        if (!this.loggedInUser)
            return;

        await this.initCentrifuge(`invitations:${this.loggedInUser.ID}`);
    }

    handleData (ctx: ExtendedPublicationContext) {
        if (ctx.data.type === "invite")
            this.$store.commit("open/addTeamInvite", ctx.data.team);
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.header {
    border-bottom: 1px solid $open-red;
    background-image: url("../../Assets/img/site/open/checkers.svg"), linear-gradient(0deg, white, white);
    background-repeat: no-repeat;
    background-position: left center;
    width: 100vw;
    position: relative;

    &__notification {
        width: 8px;
        height: 8px;
        border-radius: 100%;
        background-color: $open-red;
    }

    &__logo {
        padding-left: 6px;
        margin-top: 27.5px;
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
        position: relative;
        left: calc(30vw - 265px);
        align-self: center;
        display: flex;
        width: 40vw;
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
}
</style>
