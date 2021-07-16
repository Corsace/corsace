<template>
    <div class="footer">
        <div class="footer__left">
            <a
                class="footer__corsace"
                href="https://corsace.io"
            >
                <img
                    class="footer__logo" 
                    src="../../../Assets/img/ayim-mca/site/corsace_logo.png"
                >
                <img
                    class="footer__logo-text" 
                    src="../../../Assets/img/ayim-mca/site/corsace_text.png"
                >
            </a>

            <img 
                class="footer__dot" 
                src="../../../Assets/img/ayim-mca/site/d.png"
            >

            <a
                class="footer__corsace"
                href="https://twitter.com/kkaetwo"
            >
                <img
                    class="footer__kaetwo" 
                    src="../../../Assets/img/partners/kaetwo.png"
                >
            </a>

            <img 
                class="footer__dot" 
                src="../../../Assets/img/ayim-mca/site/d.png"
            >

            <div class="footer__socials">
                <a href="https://twitter.com/corsace_"> <img src="../../../Assets/img/social/twitter.png"> </a>
                <a href="https://discord.gg/Z6vEMsr"><img src="../../../Assets/img/social/discord.png"></a>
                <a href="https://www.twitch.tv/corsace"><img src="../../../Assets/img/social/ttv.png"></a>
                <a href="https://github.com/corsace/corsace"><img src="../../../Assets/img/social/github.png"></a>
            </div>
        </div>

        <footer-language-switcher />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

import FooterLanguageSwitcher from "./TheFooterLanguageSwitcher.vue";

@Component({
    components: {
        FooterLanguageSwitcher,
    },
})
export default class TheFooter extends Vue {
    
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';

.footer {
    background-color: #000;
    border-top-style: solid;
    border-top-color: #FFF;
    border-top-width: 3px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    flex-wrap: nowrap;
    align-items: stretch;
    height: 30px;
    @include breakpoint(tablet) {
        height: 60px;
    }
}

.footer__left {
    display: flex;
    align-items: center;
    height: 100%;
    padding-left: 1%;
    flex-grow: 1;
    overflow: hidden;
}

.footer__corsace {
    display: flex;
    align-items: center;
}

.footer__logo {
    height: 30px;
    @include breakpoint(tablet) {
        height: 60px;
    }
}

.footer__logo-text {
    height: 17px;
    @include breakpoint(tablet) {
        height: 35px;
    }
}

.footer__kaetwo {
    height: 10px;
    @include breakpoint(tablet) {
        height: 25px;
    }
}

.footer__dot {
    height: 1px;
    @include breakpoint(tablet) {
        height: 5px;
    }

    padding: 0 20px;
}

.footer__socials {
    display: flex;
    
    img {
        height: 20px;
        @include breakpoint(tablet) {
            height: 55px;
        }
    }
}
</style>