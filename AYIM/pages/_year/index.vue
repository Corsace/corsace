<template>
    <div>
        <div class="ayim-bg" />
        <div class="left-side" />
        <div class="right-side">
            <mode-switcher stretch>
                <index-page />
            </mode-switcher>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

import ModeSwitcher from "../../../MCA-AYIM/components/ModeSwitcher.vue";
import IndexPage from "../../components/IndexPage.vue";

@Component({
    components: {
        ModeSwitcher,
        IndexPage,
    },
    head () {
        return {
            title: "A Year in Mapping",
        };
    },
})
export default class Index extends Vue {


}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.ayim-bg {
    position: absolute;
    bottom: 0px;
    left: 0px;
    z-index: -6;

    height: 100%;
    width: 100%;
    padding-bottom: 9vh;

    background-image: url("../../../Assets/img/ayim-mca/site/ayim bg.png");
    background-size: auto 80%;
    background-repeat: no-repeat;
    background-position: center left;

	animation: fade-in 0.7s ease-in both;
}

.left-side {
    display: none;
}

.right-side {
    display: flex;
    align-items: flex-end;
    padding-top: 10px;
}

@include breakpoint(laptop) {    
    .left-side {
        display: block;
        flex: 0 0 40%;
        max-width: 40%;
    }
    .right-side {
        flex: 0 0 60%;
        max-width: 60%;
        padding-top: 50px;
    }
}

@keyframes fade-in {
  0% {
    opacity: 0;
    bottom: 0px;
  }
  100% {
    opacity: 1;
    bottom: 10px;
  }
}

</style>