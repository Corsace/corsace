<template>
    <div class="footer">
        <div class="footer__left">
            <div class="footer__corsace">
                <img
                    class="footer__logo" 
                    src="../../../CorsaceAssets/img/ayim-mca/site/corsace logo.png"
                >
                <img
                    class="footer__logoText" 
                    src="../../../CorsaceAssets/img/ayim-mca/site/corsace text.png"
                >
            </div>

            <img 
                class="footer__dot" 
                src="../../../CorsaceAssets/img/ayim-mca/site/d.png"
            >

            <div class="footer__socials">
                <a href="https://twitter.com/vinxis1"> <img src="../../../CorsaceAssets/img/ayim-mca/site/twitter.png"> </a>
                <a href="https://open.corsace.io/discord.94b52bb5.png"><img src="../../../CorsaceAssets/img/ayim-mca/site/discord.png"></a>
                <a href="https://open.corsace.io/twitch.6a390bfe.png"><img src="../../../CorsaceAssets/img/ayim-mca/site/ttv.png"></a>
            </div>
        </div>

        <languageSwitch />
    </div>
</template>

<script>
import languageSwitch from "./languageSwitch";

export default {
    components: {
        "languageSwitch": languageSwitch,
    },
};
</script>

<style lang="scss">
.footer {
    overflow: visible;
    background-color: #000;
    border-top-style: solid;
    border-top-color: #FFF;
    position: fixed;
    bottom: 0;
    width: 100%;
    height: 9%;
    display: flex;
    justify-content: space-between;
    flex-wrap: nowrap;
    align-items: center;
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
    height: 90px;
}

.footer__logoText {
    height: 40px;
}

.footer__dot {
    height: 5px;
    padding: 0 4%;
}

.footer__socials {
    display: flex;
    img {
        height: 70px;
    }
}
</style>