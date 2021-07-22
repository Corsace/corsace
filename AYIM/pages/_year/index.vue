<template>
    <div>
        <div
            v-if="mca"
            :style="{ backgroundImage: 'url(' + require(`../../../Assets/img/ayim-mca/site/goodbye/${this.$route.params.year}.png`) + ')' }"
            class="ayim-bg"
        />
        <div class="left-side" />
        <div :class="{'right-side': mca, 'full-side': !mca}">
            <mode-switcher
                stretch
                hide-phase
                :ignore-modes="['storyboard']"
            >
                <index-page />
            </mode-switcher>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";
import { MCA } from "../../../Interfaces/mca";

import ModeSwitcher from "../../../MCA-AYIM/components/ModeSwitcher.vue";
import IndexPage from "../../components/IndexPage.vue";

@Component({
    components: {
        ModeSwitcher,
        IndexPage,
    },
    head () {
        return {
            title: `A Year in Mapping ${this.$route.params.year ?? (new Date()).getUTCFullYear()}`,
            meta: [
                { hid: "description", name: "description", content: "A Year in Mapping details the records and statistics from each year for the osu! ranked section." },
                { hid: "og:title", property: "og:title", content: `A Year in Mapping ${this.$route.params.year ?? (new Date()).getUTCFullYear()}` },
                { hid: "og:type", property: "og:type", content: "website" },
                { hid: "og:url", property: "og:url", content: "https://ayim.corsace.io" },
                { hid: "og:description", property: "og:description", content: "A Year in Mapping details the records and statistics from each year for the osu! ranked section." },
                { hid: "og:site_name", property: "og:site_name", content: "AYIM" },
                { hid: "theme-color", name: "theme-color", content: "#fb2475" },
            ],
        };
    },
})
export default class Index extends Vue {
    @State mca!: MCA;
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.ayim-bg {
    position: absolute;
    bottom: 0px;
    left: 0px;
    z-index: -100;

    height: 100%;
    width: 100%;
    padding-bottom: 9vh;

    background-size: auto 80%;
    background-repeat: no-repeat;
    background-position: center left;

	animation: fade-in 1s ease-in both;
}

.left-side {
    display: none;
}

.right-side {
    display: flex;
    align-items: flex-end;
    padding-top: 10px;
}

.full-side {
    height: 100%;
    width: 100%;
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