<template>
    <div class="ErrImg">
        <div class="ErrSpace"></div>
        <div class="ErrText" v-html="$t('open.error.404')"></div>
    </div>

</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class errorLayout extends Vue {
}

</script>

<style lang="scss">

.ErrImg {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: fixed;
    background-image: url(../../Assets/img/open/404.png);
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;

}

.ErrSpace {
    width: 100%;
    height: 50%;
}

.ErrText {
    font-size: 35px;
    text-align: center;
    width: 25em;
    margin: auto;
}

.ErrLink {
    color: #dd3636;
    text-decoration: underline;
    text-shadow: 0 0 10px rgba(221,54,54, 0.75);
    display: contents;
}

</style>