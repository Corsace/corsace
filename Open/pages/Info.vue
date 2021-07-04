<template>
    <div class="info">
        <div class="infoBody">
            <div class="new">
                <a class="newHeader" href="#new" name="new">{{ $t('open.info.newHeader1') }}</a>
                <p v-html="$t('open.info.new1')"></p>
                <p v-html="$t('open.info.new2')"></p>
                <p v-html="$t('open.info.new3')"></p>
                <a class="headerLink" href="https://www.paypal.me/OHCofficial">{{ $t('open.info.donate') }}</a>
            </div>
            <img src="../../Assets/img/open/format.png" class="formatExample">
            <div>
                <a class="newHeader" href="#format" name="format">{{ $t('open.info.newHeader2') }}</a>
                <p v-html="$t('open.info.format1')"></p>
                <p v-html="$t('open.info.format2')"></p>
                <p v-html="$t('open.info.format3')"></p>
                <p v-html="$t('open.info.format4')"></p>
                <p v-html="$t('open.info.format5')"></p>
            </div>
            <img class="line" src="../../Assets/img/open/line.png">
            <div class="mainInfoCol">
                <div class="infoSection">
                    <a class="infoHeader" href="#about" name="about">{{ $t('open.info.header1') }}</a>
                    <p v-html="$t('open.info.about')"></p>
                    <p class="headerLink">{{ $t('open.info.important') }}</p>
                </div>
                <div class="infoSection">
                    <a class="infoHeader" href="#tournamentInfo" name="tournamentInfo">{{ $t('open.info.header2') }}</a>
                    <ul class="infoList" v-html="$t('open.info.tournamentInfo')"></ul>
                </div>
                <div class="infoSection">
                    <a class="infoHeader" href="#tournamentDates" name="tournamentDates">{{ $t('open.info.header3') }}</a>
                    <ul class="infoList" v-html="$t('open.info.tournamentDates')"></ul>
                </div>
                <div class="infoSection">
                    <a class="infoHeader" href="#tournamentRules" name="tournamentRules">{{ $t('open.info.header4') }}</a>
                    <ul class="infoList" v-html="$t('open.info.tournamentRules')"></ul>
                </div>
                <div class="infoSection">
                    <a class="infoHeader" href="#prizes" name="prizes">{{ $t('open.info.header5') }}</a>
                    <p class="prizeFollowed">{{ $t('open.info.prizes.followed') }}</p>
                    <ul class="infoList" v-html="$t('open.info.prizes.list')"></ul>
                </div>
                <div class="infoSection">
                    <a class="infoHeader" href="#seedRules" name="seedRules">{{ $t('open.info.header10') }}</a>
                    <ul class="infoList" v-html="$t('open.info.seedRules')"></ul>
                </div>
                <div class="infoSection">
                    <a class="infoHeader" href="#pickems" name="pickems">PICKEMS</a>
                    <p class="infoList">Pickems points are as follows:</p>
                    <ul class="infoList">
                        <li>1 point for getting the winning team right</li>
                        <li>1 point for getting the match point right</li>
                        <li>1 point for getting a set right</li>
                        <li>3 points for getting the <span class='bold'>exact result</span> (winner, match point, and set points)</li>
                    </ul>
                    <p>Currently there are no prizes yet, but we will be adding them soon!</p>
                </div>
                <div class="infoSection">
                    <a class="infoHeader" href="#matchRules" name="matchRules">{{ $t('open.info.header6') }}</a>
                    <ul class="infoList" v-html="$t('open.info.matchRules')"></ul>
                </div>
                <div class="infoSection">
                    <a class="infoHeader" href="#roundRules" name="roundRules">{{ $t('open.info.header7') }}</a>
                    <ul class="infoList" v-html="$t('open.info.roundRules')"></ul>
                </div>
                <div class="gitlabWrapper">
                    <a class="gitlab" href="https://git.cartooncraft.fr/corsace/open-2020">
                        <img src="../../Assets/img/open/gitlab.svg">
                        GNU GPL v3.0
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {

}
</script>

<style>
p, .infoList, .infoList li a{
    font-size: 14px;
    color: #c8cfd5;
    line-height: 1.3;
}

.info {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    margin-top: 40px;
}

.infoBody {
    background-color: #202020;
    grid-column: 2;
    display: grid;
    grid-template-columns: repeat(2,1fr);
    grid-column-gap: 10px;
    grid-row-gap: 10px;
    justify-items: center;
    align-items: center;
    padding: 50px;
    text-shadow: 3.5px 3.5px 5px rgba(24, 7, 0, 0.75);
}

.new {
    grid-column: 1/3;
}

.newHeader {
    font-size: 60px;
    font-weight: bold;
    line-height: 0.75;
    white-space: nowrap;
}

.formatExample {
    width: 100%;
    min-width: 400px;
}

.headerLink {
    color: #ff5b5c;
    font-weight: bold;
    font-size: 25px;
}

.line, .mainInfoCol {
    grid-column: 1/3;
}

.infoSection {
    padding: 10px 0;
}

.infoHeader {
    font-size: 48px;
    font-weight: bold;
    line-height: 0.75;
    text-shadow: none;
}

.highlight {
    color: #ff5b5c;
}

.bold, .infoList li a {
    font-weight: bold;
}

.prizeFollowed {
    margin-bottom: 0;
}

.prizeList {
    margin-top: 0.25em;
}

.gitlabWrapper {
    display: flex;
    justify-content: center;
}

.gitlab {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.gitlab img {
    height: 100px;
    width: 100px;
}

</style>