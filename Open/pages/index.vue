<template>
    <div class="home">
        <img class="graphic" src="../../Assets/img/open/open-logo.png">
        <div class="homeLinks">
            <a href="https://www.twitch.tv/corsace" target="_blank"><img src="../../Assets/img/open/twitch.png"></a>
            <a href="https://www.youtube.com/channel/UCSbls6Oeewieon_lWjW3-sQ" target="_blank"><img src="../../Assets/img/open/youtube.png"></a>
            <a href="https://discord.gg/Z6vEMsr" target="_blank"><img src="../../Assets/img/open/discord.png"></a>
            <a href="https://twitter.com/corsace_" target="_blank"><img src="../../Assets/img/open/twitter.png"></a>
            <span class="homeLinksText">{{ $t('open.home.watchNow') }}</span>
        </div>
        <div class="infoSmall">
            <div>{{ $t('open.home.dates') }}</div>
            <div>{{ $t('open.home.teams') }}</div>
        </div>
    </div>
</template>

<script>
export default {
}
</script>

<style>
.home {
    display: flex;
    flex-direction: column;
    position: relative;
}

.announcement {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 30px 0;
    font-weight: bold;
    line-height: 0.75;
}

.from {
    font-size: 20.5px;
    color: #b64c4c;
    margin-bottom: 10px;
}

.tournamentName {
    color: white;
}

.present {
    font-size: 61.6px;
}

.graphic {
    z-index: -100;
    position: fixed;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.backImg {
    top: -80px;
}

.frontImg {
    left: -280px;
}

.infoSmall {
    color: #866662;
    display: flex;
    flex-direction: column;
    font-size: 26px;
    justify-content: center;
    margin: 30px 0 0;
    align-items: center;
    letter-spacing: 8.3px;
    line-height: 1.4;
    text-shadow: 0px 0px 10px rgba(134,102,98,0.3);
    position: relative;
    top: 15%;
}

.homeLinks {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-row-gap: 5px;
    justify-items: center;
    align-items: center;
    align-self: center;
    padding: 25px 40px;
    border: solid;
    border-radius: 35px;
    margin-top: 600px;
    color: #f54b4b;
    font-size: 26px;
    letter-spacing: 8.3px;
    box-shadow: 0 0 10px rgba(134,102,98,.3);
    line-height: 0.75;
    position: relative;
    top: 15%;
}

.homeLinksText {
    grid-column: 1/5;
    grid-row: 2/3;
    text-align: center;
    white-space: nowrap;
    text-shadow: 0 0 10px rgba(134,102,98,.3);
}

@media only screen and (min-width: 893px) and (max-width: 1724px) {
    .graphic {
        height: 39vw;
    }
}

@media only screen and (max-width: 892px) {
    .graphic {
        height: 348px;
        top: 50%;
        left: 0;
        right: 0;
        margin-left: auto;
        margin-right: auto;
        transform: translateY(-50%);
    }
}
</style>
