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
                        {{ loggedInUser.osu.username }}
                    </div>
                    <a class="header-login__welcome" href="/api/logout">
                        {{ $t('mca_ayim.header.logout') }}
                    </a>
                </div>
            </div>

            <div
                v-else
                class="header-login"
            >
                <a
                    class="header-login__link"
                    href="#"
                    @click="toogleLoginModal"
                >
                    {{ $t('main.header.login') }}
                    <div class="arrow arrow--right" />
                </a>
                <a
                    class="header-login__link"
                    href="#"
                    @click="toogleLoginModal"
                >
                    {{ $t('main.header.register') }}
                    <div class="arrow arrow--right" />
                </a>
            </div>
        </div>

        <div class="main">
            <div class="section-info">
                <div class="info-container">
                    <div class="info-warning">
                        <div
                            class="info-warning__group"
                            v-for="i in 20"
                            :key="i"
                        >
                            <img
                                :key="i"
                                class="info-warning__lines"
                                src="../../Assets/img/main/lines.png"
                            >
                            <div 
                                :key="i + '-text'"
                                class="info-warning__text"
                            >
                                {{ $t('main.index.underConstruction') }}
                            </div>
                        </div>
                    </div>
                    <h2 class="info-message">
                        <div>{{ $t('main.index.sorry') }}</div>
                        <p>{{ $t('main.index.development') }}</p>
                        
                        {{ $t('main.index.theTeam') }}
                    </h2>
                    <div class="info-warning">
                        <div
                            class="info-warning__group"
                            v-for="i in 20"
                            :key="i"
                        >
                            <img
                                :key="i"
                                class="info-warning__lines"
                                src="../../Assets/img/main/lines.png"
                            >
                            <div 
                                :key="i + '-text'"
                                class="info-warning__text"
                            >
                                {{ $t('main.index.underConstruction') }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
            <a class="subfooter__powered" href="https://twitter.com/kkaetwo">
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

        <login-modal
            v-if="showLoginModal"
            site="mca"
            @close="toogleLoginModal"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import LanguageSwitcher from "../components/LanguageSwitcher.vue";
import LoginModal from "../../MCA-AYIM/components/header/LoginModal.vue";

import { UserInfo } from "../../Interfaces/user";

@Component({
    components: {
        LoginModal,
        LanguageSwitcher,
    },
    head () {
        return {
            title: "Corsace",
        };
    },
})
export default class Default extends Vue {

    @State loggedInUser!: UserInfo;

    showLoginModal = false;
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
            url: "#",
        },
    };

    get avatarURL (): string  {
        return this.loggedInUser?.osu?.avatar || "";
    }
    
    toogleLoginModal (): void {
        this.showLoginModal = !this.showLoginModal;
    }

    async mounted () {
        await this.$store.dispatch("setInitialData");
    }
    
}
</script>

<style lang="scss">
$dark: #0f0f0f;
$dark-dark-gray: #141414;
$dark-gray: #242424;
$gray: #343434;
$light-gray: #cccccc;
$pink: #e98792;

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
            background-image: linear-gradient(to top, rgba(244, 182, 193, 0.82), #e98792);
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

		width: 20%;

        margin-left: 15px;
        margin-right: 15px;
	}
    
    &__link {
        display: flex;
        align-items: center;
    }

    &__welcome {
        color: #6f6f6f;
    }

    &__username {
        text-transform: uppercase;
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
    background-color: $gray;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 50px 10%;
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
    padding: 20px 5%;
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
