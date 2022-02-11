<template>
    <div 
        class="header"
        :class="`header--${viewTheme}`"
    >
        <slot />

        <div 
            v-if="loggedInUser"
            class="header-login"
        >
            <div class="header-login__welcome-container">
                <img 
                    :src="avatarURL"
                    class="header-login__avatar"
                >
                <div 
                    class="header-login__welcome"
                    :class="`header-login__welcome--${viewTheme}`"
                >
                    {{ $t('header.welcomeBack') }}
                </div>
                <div
                    v-if="loggedInUser.discord.username"
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
                    v-else-if="loggedInUser.osu.username"
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
                            class="dot" 
                            :class="`dot--${viewTheme}`"
                        />
                        | discord {{ $t('header.login') }}
                    </a>
                    <a 
                        v-else
                        :href="`/api/login/discord?site=${site}&redirect=${$route.fullPath}`"
                    >
                        <div 
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
            :class="`header-login--${viewTheme}`"
        >
            <a
                class="header-login__link"
                :class="`header-login__link--${viewTheme}`"
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
import { Vue, Component, Prop } from "vue-property-decorator";
import { State } from "vuex-class";

import { UserInfo } from "../../../Interfaces/user";

@Component
export default class TheHeader extends Vue {

    @Prop({ type: String, required: true }) readonly site!: string;

    @State loggedInUser!: UserInfo;
    @State viewTheme!: "light" | "dark";

    get avatarURL (): string  {
        return this.loggedInUser?.osu?.avatar || "";
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
        color: black;
    }
    width: 100%;
    height: 70px;
    @include breakpoint(mobile) {
        height: 55px;
    }
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    @include transition;
}

.header-login {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    margin-right: 30px;
    margin-left: auto;
    
    @include breakpoint(mobile) {
        margin-right: 15px;
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

        margin: 0 15px;
        @include breakpoint(mobile) {
            margin: 0 5px;
        }
	}
    
    &__link {
        display: flex;
        align-items: center;
        @include transition;
        font-weight: bold;
        &--light {
            color: black;
        }
        &--dark {
            color: white;
        }
    }

    &__line {
        &--corsace {
            color: $pink;
        }
        &--mca, &--ayim{
            color: $blue;
        }
        padding: 0 5px;
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
        @include breakpoint(mobile) {
            font-size: 0.75rem;
        }
        & > a {
            display: flex;
            align-items: center;
            font-size: 0.75rem;
            @include breakpoint(mobile) {
                font-size: 0.6rem;
            }

            & > div {
                width: 10px;
                height: 10px;
                margin-left: 5px;
            }
        }
    }

    &__username {
        text-transform: uppercase;
        text-overflow: ellipsis;
        @include breakpoint(mobile) {
            font-size: 0.75rem;
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
    @include transition;
}

.arrow {
    width: 15px;
    height: 15px;
    margin-left: 10px;
    background-repeat: no-repeat;
    background-size: contain;

    &--up {
        background-image: url('../../img/main/arrow_up.png');
    }

    &--right {
        background-image: url('../../img/main/arrow_right.png');
    }
}
</style>