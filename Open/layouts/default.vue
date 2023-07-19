<template>
    <div class="layout layout--open">
        <DevBanner 
            v-if="devBanner"
            @close="devBanner = false"
        />
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
                    to="/"
                    class="header__nav-item"
                >
                    HOME
                </NuxtLink>
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
                <!-- <NuxtLink
                    to="/schedule" 
                    class="header__nav-item"
                >
                    SCHEDULE
                </NuxtLink> -->
                <NuxtLink
                    to="/mappool" 
                    class="header__nav-item"
                >
                    MAPPOOL
                </NuxtLink>
                <!-- <NuxtLink
                    to="/staff" 
                    class="header__nav-item"
                >
                    STAFF
                </NuxtLink> -->
            </div>
            <template #login>         
                <div 
                    v-if="loggedInUser?.discord.userID"
                    class="header__manage_teams"
                >
                    <NuxtLink
                        v-if="team"
                        :to="`/team/${team.ID}`"
                        class="header__manage_teams_item"
                    >
                        {{ team.abbreviation.toUpperCase() }}
                    </NuxtLink>
                    <NuxtLink
                        v-else
                        to="/team/create"
                        class="header__manage_teams_item"
                    >
                        CREATE TEAM
                    </NuxtLink>
                    <a
                        v-if="!team"
                        class="header__manage_teams_item"
                        @click="togglePopup()"
                    >
                        INVITATIONS ({{ teamInvites?.length || 0 }})
                    </a>
                </div>
                <div
                    v-else
                    class="header__manage_teams"
                >
                    LOGIN DISCORD TO MANAGE TEAMS/INVITES
                </div>
                <div 
                    v-show="isOpen"
                    class="header__popup"
                >
                    <div class="header__popup_title">
                        TEAM INVITES
                    </div>
                    <hr class="line--red line--no-space">
                    <ul v-if="!team && teamInvites">
                        <li
                            v-for="invite in teamInvites"
                            :key="invite.ID"
                        > 
                            {{ invite.name }}
                            <div class="header_popup_accept">
                                <a @click="inviteAction(invite.ID, 'accept')">ACCEPT</a> | <a @click="inviteAction(invite.ID, 'decline')">DECLINE</a>
                            </div>
                        </li>
                    </ul>
                    <div v-else>
                        You currently have no invites
                    </div>
                </div>
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
import { State, namespace } from "vuex-class";

import { UserInfo } from "../../Interfaces/user";
import { BaseTeam, Team } from "../../Interfaces/team";

import DevBanner from "../../Assets/components/DevBanner.vue";
import TheHeader from "../../Assets/components/header/TheHeader.vue";
import TheFooter from "../../Assets/components/footer/TheFooter.vue";
import Tooltip from "../../Assets/components/footer/Tooltip.vue";

const openModule = namespace("open");

@Component({
    components: {
        DevBanner,
        TheHeader,
        TheFooter,
        Tooltip,
    },
    middleware: "index",
})
export default class Default extends Vue {
    
    @State viewTheme!: "light" | "dark";
    @State loggedInUser!: null | UserInfo;

    @openModule.State team!: Team | null;
    @openModule.State teamInvites!: BaseTeam[] | null;

    devBanner = true;
    isSmall = false;
    isOpen = false;

    togglePopup () {
        this.isOpen = !this.isOpen;
    }

    async mounted () {
        if (process.client) {
            this.isSmall = window.innerWidth < 576;
            window.addEventListener("resize", () => {
                this.isSmall = window.innerWidth < 576;
            });
        }

        await Promise.all([
            this.$store.dispatch("setViewTheme", "dark"),
        ]);
    }

    async inviteAction (inviteID: number, action: "accept" | "decline") {
        try {
            await this.$axios.post(`api/team/invite/${inviteID}/${action}`);
            await this.$store.dispatch("open/setTeam");
            await this.$store.dispatch("open/setInvites");
        } catch (e) {
            alert("Something went wrong. Contact VINXIS. Error is in console, which can be accessed by pressing F12.");
            console.log(e);
        }
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

    /*temp */
    &__popup {
        padding: 5px;
        position: absolute;
        opacity: 1;
        top: calc(20vh - 100px);
        left: calc(100% - 20vw - 100px);
        z-index: 1;
        border: 1px solid $open-red;
        background-color: $open-dark;
        min-height: 200px;
        min-width: 300px;
        filter: drop-shadow(0 0 0.75rem $open-red);

        &_title {
            font-family: $font-communterssans;
            margin-bottom: 5px;
        }

        & ul {
            padding-left: 0;
            list-style-type: none;
            font-family: $font-ggsans;
            font-weight: 500;
            
            & li {
                padding-bottom: 3px;
            }

            & a {
                font-family: $font-ggsans;
                font-size: $font-sm;
                text-decoration: none;
                cursor: pointer;
                color: $gray;

                &:hover {
                    color: white;
                }
            }
        }
    }
    /*temp*/
    &__manage_teams {
        width: 150px;
        align-self: center;
        display: flex;
        flex-direction: column;

        &_item {
            display: flex;
            position: relative;
            padding: 0 5px;
            font-family: $font-ggsans;
            font-weight: 500;
            text-decoration: none;

            &:hover {
                text-decoration: none;
                cursor: pointer;
                color: $open-red;
            }
        
            &:after {
                content: "";
                position: absolute;
                left: -10px;
                bottom: 8px; 
                width: 4.5px;
                height: 4.5px;
                transform: rotate(-45deg);
                background-color: $open-red;
            }
        }
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
