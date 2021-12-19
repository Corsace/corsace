<template>
    <div class="layout">
        <div class="header">
            <div class="header-nav">
                <div class="header-nav__brand-container">
                    <div class="header-nav__brand" />
                </div>
                <img
                    class="header-nav__brand-name"
                    src="../../Assets/img/ayim-mca/site/corsace_text.png"
                    alt=""
                >
            </div>

            <div 
                v-if="loggedInUser"
                class="header-login"
            >
                <div class="header-login__welcome-container">
                    <img 
                        :src="avatarURL"
                        class="header-login__avatar"
                    >
                    <div class="header-login__welcome">
                        {{ $t('mca_ayim.header.welcomeBack') }}
                    </div>
                    <div
                        v-if="loggedInUser.osu"
                        class="header-login__username"
                    >
                        {{ loggedInUser.osu.username }} <span class="header-login__line">|</span> {{ loggedInUser.discord ? loggedInUser.discord.username : "" }}
                    </div>
                    <div class="header-login__welcome">
                        <a
                            href="/api/logout"
                        >
                            {{ $t('mca_ayim.header.logout') }}
                            <div class="arrow arrow--right" />
                        </a>
                        <a
                            v-if="!loggedInUser.discord"
                            :href="'/api/login/discord?site=corsace&redirect=' + $route.fullPath"
                        >
                            | DISCORD {{ $t('main.header.login') }}
                            <div class="arrow arrow--right" />
                        </a>
                        <a 
                            v-else
                            :href="'/api/login/discord?site=corsace&redirect=' + $route.fullPath"
                        >
                            {{ $t('main.header.changeDiscord') }}
                            <div class="arrow arrow--right" />
                        </a>
                    </div>
                </div>
            </div>

            <div
                v-else
                class="header-login"
            >
                <a
                    class="header-login__link"
                    :href="'/api/login/osu?site=corsace&redirect=' + $route.fullPath"
                >
                    osu! {{ $t('main.header.login') }}
                    <div class="arrow arrow--right" />
                </a>
            </div>
        </div>

        <div class="main">
            <a 
                class="section-info"
                href="https://shop.corsace.io"
                target="_blank"
            >   
                <div class="section-info__overlay">
                    <div class="announcement">
                        <div class="announcement__url">shop.corsace.io</div>
                        <div>{{ $t('main.merch.official') }}</div>
                        <div>{{ $t('main.merch.avail') }}</div>
                    </div>
                    <div class="announcement__info">
                        <div class="announcement__info--bold">{{ $t('main.merch.name') }}</div>
                        <div>{{ $t('main.merch.colours') }}</div>
                        <div class="announcement__info--cost">€24.99</div>
                    </div>
                </div>
            </a>

            <div class="section-events">
                <h2 class="events-title">
                    CORSACE EVENTS
                </h2>

                <div class="events">
                    <a
                        v-for="(event, key) in events"
                        :key="key"
                        class="event"
                        :href="event.url"
                        target="_blank"
                    >
                        <div class="event__image-container">
                            <img
                                class="event__image"
                                :src="require(`../../Assets/img/main/${key}.jpg`)"
                                alt=""
                            >
                        </div>
                        <div class="event__title">
                            {{ event.title }}
                        </div>
                    </a>
                </div>
            </div>
        </div>

        <div class="subfooter">
            Powered by
            <a
                class="subfooter__powered"
                href="https://twitter.com/kkaetwo"
            >
                <img
                    class="subfooter__kaetwo" 
                    src="../../Assets/img/partners/kaetwo.png"
                >
            </a>
        </div>

        <div class="footer">
            <div class="socials">
                <a
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
                    href="https://www.twitch.tv/corsace"
                    target="_blank"
                >
                    <img
                        class="socials__icon"
                        src="../../Assets/img/social/ttv.png"
                        alt=""
                    >
                </a>
                <a
                    href="https://github.com/corsace/corsace"
                    target="_blank"
                >
                    <img
                        class="socials__icon"
                        src="../../Assets/img/social/github.png"
                        alt=""
                    >
                </a>
            </div>
            
            <language-switcher />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import LanguageSwitcher from "../components/LanguageSwitcher.vue";

import { UserInfo } from "../../Interfaces/user";

@Component({
    components: {
        LanguageSwitcher,
    },
    head () {
        return {
            title: "Corsace",
            meta: [
                { hid: "description", name: "description", content: "Corsace is a series of projects (primarily osu!-related) led by VINXIS which consists of tournaments, events, projects, and many more!" },
                { hid: "og:title", property: "og:title", content: "Corsace" },
                { hid: "og:type", property: "og:type", content: "website" },
                { hid: "og:url", property: "og:url", content: "https://corsace.io" },
                { hid: "og:description", property: "og:description", content: "Corsace is a series of projects (primarily osu!-related) led by VINXIS which consists of tournaments, events, projects, and many more!" },
                { hid: "og:site_name", property: "og:site_name", content: "Corsace" },
                { hid: "theme-color", name: "theme-color", content: "#e98792" },
            ],
        };
    },
})
export default class Default extends Vue {

    @State loggedInUser!: UserInfo;

    events = {
        "ayim": {
            title: "A YEAR IN MAPPING",
            url: "https://ayim.corsace.io",
        },
        "mca": {
            title: "MAPPERS' CHOICE AWARDS",
            url: "https://mca.corsace.io",
        },
        "open": {
            title: "CORSACE OPEN",
            url: "https://open.corsace.io",
        },
        "closed": {
            title: "CORSACE CLOSED",
            url: "https://osu.ppy.sh/community/forums/topics/1324620",
        },
    };

    get avatarURL (): string  {
        return this.loggedInUser?.osu?.avatar || "";
    }

    async mounted () {
        await this.$store.dispatch("setInitialData");
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';

$dark: #0f0f0f;
$dark-dark-gray: #141414;
$dark-gray: #242424;
$gray: #343434;
$light-gray: #cccccc;
$pink: #e98792;
$dark-cyan: linear-gradient(#009595, #008080);

@keyframes leftscroll {
    from {
        transform: translateX(0%);
    }
    to {
        transform: translateX(100%);
    }
}

.layout {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.main {
    display: flex;
    flex-direction: column;
    flex: 1;
    background-color: $dark-gray;
}

.header {
    background-color: $dark;
    width: 100%;
    height: 70px;
    @include breakpoint(mobile) {
        height: 55px;
    }
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.header-nav {
    display: flex;
    align-items: center;

    &__brand {
        &-container {
            width: 70px;
            height: 70px;
            @include breakpoint(mobile) {
                width: 55px;
                height: 55px;
            }
            background-image: linear-gradient(to top, rgba(244, 182, 193, 0.82), #e98792);
        }

        &-name {
            @include breakpoint(mobile) {
                width: 100px;
            }
        }

        width: 100%;
        height: 100%;
        background-size: contain;
        background-image: url('../../Assets/img/ayim-mca/site/corsace_logo.png');
    }
}

.header-login {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    margin-right: 30px;
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
    }

    &__line {
        color: $pink;
        padding: 0 5px;
    }

    &__welcome {
        color: #6f6f6f;
        display: flex;
        @include breakpoint(mobile) {
            font-size: 0.75rem;
        }
        & > a {
            color: #6f6f6f;
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
        @include breakpoint(mobile) {
            font-size: 0.75rem;
        }
    }
}

.subfooter {
    color: $light-gray;
    background-color: $dark-dark-gray;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 0;

    &__powered {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    &__kaetwo {
        height: 15px;
        padding: 0 5px;
    }
}

.footer {
    background-color: $dark;
    width: 100%;
    height: 50px;
    display: flex;
    justify-content: space-between;
}

.socials {
    height: 100%;
    display: flex;
    align-items: center;
    margin-left: 30px;

    &__icon {
        margin-right: 10px;
        width: auto;
        height: 30px;
    }
}

.section-info {
    height: 100%;
    max-height: 45vh;
    @include breakpoint(mobile) {
        height: 50vh;
        max-height: unset;
    }
    
    display: flex;
    align-items: flex-end;
    justify-content: center;
    flex-direction: column;

    background-repeat: no-repeat;
    background-size: 69% 170%, auto;
    background-position: -8vw 32%, center;
    background-image: url('../../Assets/img/main/shirts/combined.png'), $dark-cyan;

    @include breakpoint(mobile) {
        background-size: contain;
        background-position: center;
    }

    &__overlay {
        height: 100%;
        width: 100%;

        padding: 5px;

        display: flex;
        align-items: flex-end;
        justify-content: center;
        flex-direction: column;
        @include breakpoint(mobile) {
            flex-direction: row;
        }

        & > div {
            height: 100%;
            width: 45vw;  
        }
    }

    &:hover {
        text-decoration: none;
    }
}

.announcement {
    display: flex;
    flex-direction: column;
    justify-content: end;
    align-items: end;

    margin-right: 1vw;

    font-size: 2vw;

    &__url {
        font-family: 'CocoGoose Pro', 'sans-serif';
        font-size: 4vw;
        line-height: 4vw;
    }

    &__info {
        margin-left: 1vw;

        position: relative;

        display: flex;
        flex-direction: column;
        justify-content: center;

        font-size: 2vw;
        @include breakpoint(laptop) {
            font-size: 1vw;
        }

        @include breakpoint(mobile) {
            justify-content: end;
        }

        &--bold {
            font-weight: bold;
        }

        &--cost {
            position: absolute;
            left: 35%;

            font-size: 2.5vw;
            font-weight: bold;

            @include breakpoint(laptop) {
                font-size: 2vw;
                height: 1vw;
            }
            
            @include breakpoint(mobile) {
                position: unset;
                height: unset;
            }
        }
    }
}

.info-container {
    width: 100%;
    height: 100%;
    background-color: $dark-gray;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px;
}

.info-warning {
    color: $pink;
    background-color: $dark;
    border-radius: 20px;
    padding: 10px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    font-style: italic;
    overflow: hidden;
    white-space: nowrap;

    width: 80%;

    &__lines {
        max-height: 15px;
        margin: 0 10px;
    }

    &__group {
        display: flex;
        align-items: center;
        justify-content: center;

        position: relative;

        animation: leftscroll 8s infinite linear;
    }
}

.info-message {
    text-align: center;
}

.section-events {
    background-color: $dark-gray;
    display: flex;
    flex-direction: column;
    padding: 20px 2%;
}

.events-title {
    text-transform: uppercase;
    border-bottom-color: $pink;
    border-bottom-style: solid;
    border-bottom-width: 1px;
}

.events {
    margin-top: 30px;
    margin-bottom: 30px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-around;
}

.event {
    background-color: $dark;
    height: 180px;
    min-width: 300px;
    width: 20%;
    display: flex;
    flex-direction: column;
    border-radius: 10px;
    margin-bottom: 10px;
    margin-right: 10px;

    &__image {
        &-container {
            width: 100%;
            height: 100%;
            overflow: hidden;
        }

        width: 100%;
        height: 100%;
        object-fit: cover;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
    }

    &__title {
        border-top: 1px solid $pink;
        text-transform: uppercase;
        padding: 10px 10px 2em 10px;
    }
}

.arrow {
    width: 15px;
    height: 15px;
    margin-left: 10px;
    background-repeat: no-repeat;
    background-size: contain;

    &--up {
        background-image: url('../../Assets/img/main/arrow_up.png');
    }

    &--right {
        background-image: url('../../Assets/img/main/arrow_right.png');
    }
}

</style>
