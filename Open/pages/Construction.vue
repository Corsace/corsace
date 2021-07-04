<template>
    <div class="construction">
        <div class="constructionBody">
            <div class="constructionHeader">
                {{ $t('open.construction.under') }}
            </div>
            <div class="constructionText">
                {{ $t('open.construction.check') }}
            </div>
        </div>
    </div>
</template>

<script>
export default {

}
</script>

<style>
.construction {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    grid-template-rows: 2fr 1fr 2fr;
    margin-top: 40px;
    justify-items: center;
    text-align: center;
    white-space: nowrap;
}

.constructionBody {
    background-image: url(../../Assets/img/open/constructionbg.png);
    padding: 38px 65px;
    grid-column: 2;
    grid-row: 2;
    line-height: 0.75;
} 

.constructionHeader {
    font-size: 72px;
    font-weight: bold;
}

.constructionText {
    color: #866662;
    font-size: 24px;
    letter-spacing: 7.7px;
    margin-top: 12px;
    text-shadow: 0 0 8px rgba(134,102,98,0.75);
}
</style>
