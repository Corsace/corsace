<template>
    <div class="layout layout--mca">
        <the-header
            class="mcaayim__header"
        >
            <a 
                :href="`/${$route.params.year}`"
            >          
                <img
                    :src="require(`../../Assets/img/corsace.png`)"
                    class="mcaayim__logo"
                    :class="`mcaayim__logo--${viewTheme}`"
                >
            </a>
        </the-header>

        <nuxt 
            class="main" 
            :class="`main--${viewTheme}`"
        />
        
        <the-footer class="">
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
        background-size: cover;
    }
    &--dark {
        background-color: $darker-gray;
        background-size: cover;
    }
}
</style>
