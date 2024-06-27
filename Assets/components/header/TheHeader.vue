<template>
    <div 
        class="header"
        :class="`header--${viewTheme}`"
    >
        <slot />

        <div 
            v-if="loggedInUser"
            class="header-login"
            :class="`header-login--${site}`"
        >
            <div class="header-login__welcome-container">
                <slot name="login" />
                <img 
                    :src="avatarURL"
                    class="header-login__avatar"
                >
                <div
                    v-if="isSmall"
                    class="header-login__welcome"
                >
                    {{ loggedInUser.discord.username ? loggedInUser.discord.username : loggedInUser.osu.username }}
                </div>
                <div 
                    v-else
                    class="header-login__welcome"
                    :class="`header-login__welcome--${viewTheme}`"
                >
                    {{ $t('header.welcomeBack') }}
                </div>
                <div
                    v-if="loggedInUser.discord.username && !isSmall"
                    class="header-login__username"
                >
                    {{ loggedInUser.osu.username }} 
                    <span 
                        class="header-login__line" 
                        :class="`header-login__line--${site}`"
                    >|</span>
                    {{ loggedInUser.discord.username }}
                </div>
                <div
                    v-else-if="loggedInUser.osu.username && !isSmall"
                    class="header-login__username"
                >
                    {{ loggedInUser.osu.username }}
                </div>
                <div  
                    class="header-login__welcome"
                    :class="`header-login__welcome--${viewTheme}`"
                >
                    <a
                        href="/api/logout"
                    >
                        <div
                            v-if="!isSmall" 
                            class="dot" 
                            :class="`dot--${viewTheme}`"
                        />
                        {{ $t('header.logout') }}
                    </a>
                    <a
                        v-if="!loggedInUser.discord || !loggedInUser.discord.userID"
                        :href="`/api/login/discord?site=${site}&redirect=${$route.fullPath}`"
                    >
                        <div 
                            v-if="!isSmall" 
                            class="dot" 
                            :class="`dot--${viewTheme}`"
                        />
                        discord {{ $t('header.login') }}
                    </a>
                    <a 
                        v-else
                        :href="`/api/login/discord?site=${site}&redirect=${$route.fullPath}`"
                    >
                        <div 
                            v-if="!isSmall" 
                            class="dot" 
                            :class="`dot--${viewTheme}`"
                        />
                        {{ $t('header.changeDiscord') }}
                    </a>
                </div>
            </div>
        </div>
        <div
            v-else
            class="header-login"
            :class="`header-login--${site}`"
        >
            <a
                class="header-login__link"
                :class="`header-login__link--${viewTheme} header-login__link--${site}`"
                :href="`/api/login/osu?site=${site}&redirect=${$route.fullPath}`"
            >
                <div 
                    class="dot" 
                    :class="`dot--${viewTheme}`"
                />
                osu! {{ $t('header.login') }}
            </a>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import { UserInfo } from "../../../Interfaces/user";

@Component
export default class TheHeader extends Vue {

    @State site!: string;
    @State loggedInUser!: null | UserInfo;
    @State viewTheme!: "light" | "dark";

    get avatarURL (): string  {
        return this.loggedInUser?.osu?.avatar ?? "";
    }

    isSmall = false;

    mounted () {
        if (process.client) {
            this.isSmall = window.innerWidth < 992;
            window.addEventListener("resize", () => {
                this.isSmall = window.innerWidth < 992;
            });
        }
    }

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.header {
    &--dark {
        background-color: $dark;
    }
    &--light {
        background-color: white;
        color: black;
    }
    position: relative;
    top: 0;

    width: 100%;
    height: 90px;
    @include breakpoint(mobile) {
        height: 55px;
    }
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.header-login {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    margin-left: auto;
    
    @include breakpoint(mobile) {
        margin-right: 10px;
    }
    margin-right: 15px;
    @include breakpoint(laptop) {
        margin-right: 30px;
    }
    
    &--open {
        color: $open-red;
    }

    &__welcome-container {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;

        justify-content: center;
        align-content: flex-end;

        height: 100%;
    }

    &__avatar {
		border-radius: 100%;
        max-height: 100%;

        flex-basis: 100%;

        padding: 10px 0;

        margin: 0 5px;
        @include breakpoint(tablet) {
            margin: 0 10px;
        }
	}
    
    &__link {
        display: flex;
        align-items: center;

        font-weight: bold;
        &--light {
            color: black;
        }
        &--dark {
            color: white;
        }

        &--open {
            color: $open-red;
        }
    }

    &__line {
        &--corsace {
            color: $pink;
        }
        &--mca-ayim {
            color: $blue;
        }
        padding: 0 2.5px;
        @include breakpoint(laptop) {
            padding: 0 5px;
        }
    }

    &__welcome {
        &--light {
            color: $dark-gray;
            & > a {
                color: $dark-gray;
            }
        }
        &--dark {
            color: #6f6f6f;
            & > a {
                color: #6f6f6f;
            }
        }
        display: flex;
        flex-direction: column;
        @include breakpoint(laptop) {
            flex-direction: row;
        }

        @include breakpoint(mobile) {
            font-size: $font-sm;
        }
        font-size: 0.8rem;
        @include breakpoint(laptop) {
            font-size: $font-base;
        }
        & > a {
            display: flex;
            align-items: center;
            font-size: $font-sm;
            @include breakpoint(mobile) {
                font-size: $font-xsm;
            }

            & > div {
                width: 10px;
                height: 10px;
                margin-left: 10px;
            }
        }
    }

    &__username {
        text-transform: uppercase;
        text-overflow: ellipsis;
        @include breakpoint(mobile) {
            font-size: $font-sm;
        }
    }
}

.dot {
    width: 3px;
    height: 3px;
    border-radius: 100%;
    background: black;
    margin-right: 8px;
    &--dark {
        background: white;
    }
}
</style>