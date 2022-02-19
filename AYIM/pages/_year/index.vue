<template>
    <div>
        <div 
            class="index"
            :class="`index--${viewTheme}`"
        >
            <div class="portal__mca">
                MCA
            </div>
            <div class="portal__other">
                <a 
                    href="https://shop.corsace.io"
                    class="portal__shop"
                >
                    CORSACE SHOP
                </a>
                <a 
                    href="https://corsace.io"
                    class="portal__main"
                >
                    CORSACE MAIN
                </a>
            </div>
            <div>
                USUAL WELCOME BACK TO AYIM
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import { MCA } from "../../../Interfaces/mca";

const mcaAyimModule = namespace("mca-ayim");

@Component({
    components: {
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
    @mcaAyimModule.State mca!: MCA;
    @mcaAyimModule.State selectedMode!: string;

    @State viewTheme!: "light" | "dark";
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.index {
    background-image: url("../../../Assets/img/site/mca-ayim/home-bg.png");
    background-attachment: local;

    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    font-size: $font-title;
    &--light {
        color: black;
    }
    &--dark {
        color: white;
    }

    overflow-y: scroll;

    -ms-overflow-style: none;
    scrollbar-width: none;
    &::-webkit-scrollbar {
        display: none;
    }
}

.portal {
    &__mca {
        padding: 100px 0;
    }

    &__other {
        display: flex;
        padding-bottom: 100px;
        & a {
            color: $blue;
            background-color: white;

            width: 30vw;
            margin: 0 25px;
            padding: 10px;
            border: 1px $blue solid; 

            text-align: center;
        }
    }
}

@include breakpoint(laptop) {
    .left-side, .right-side {
        flex: 0 0 50%;
        max-width: 50%;
    }
}

</style>