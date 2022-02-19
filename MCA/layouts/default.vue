<template>
    <div class="layout layout--mca">
        <the-header 
            :site="'mca'"
            class="mcaayim__header"
        >
            <img
                :src="require(`../../Assets/img/site/mca-ayim/year/${$route.params.year}-${viewTheme}-mca.png`)"
                class="mcaayim__logo"
                :class="`mcaayim__logo--${viewTheme}`"
            >

            <mode-switcher />
        </the-header>

        <nuxt 
            class="main" 
            :class="`main--${viewTheme}`"
        />
        
        <the-footer class="mcaayim__footer">
            <a 
                class="footer-nav__brand-name" 
                :class="`footer-nav__brand-name--${viewTheme}`"
                href="https://corsace.io"
            >
                <img
                    src="../../Assets/img/site/mca-ayim/corsace_text.png"
                    alt=""
                >
            </a>
        </the-footer>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import TheHeader from "../../Assets/components/header/TheHeader.vue";
import ModeSwitcher from "../../Assets/components/mca-ayim/ModeSwitcher.vue";
import TheFooter from "../../Assets/components/footer/TheFooter.vue";

@Component({
    components: {
        TheHeader,
        ModeSwitcher,
        TheFooter,
    },
    middleware: "mca",
})
export default class Default extends Vue {

    @State viewTheme!: "light" | "dark";

    async mounted () {
        await Promise.all([
            this.$store.dispatch("setInitialData"),
            this.$store.dispatch("mca-ayim/setSelectedMode"),
        ]);
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables'; 

.mcaayim {
    &__header {
        border-bottom: 1px solid $blue;
    }

    &__logo {
        height: 60px;
        padding-left: 10px;
        align-self: center;

        @include breakpoint(mobile) {
            height: 45px;
            padding-left: 7px;
        }
    }

    &__footer {
        border-top: 1px solid $blue;
    }
}

.footer-nav {
    &__brand {

        &-name {
            & img {
                object-fit: contain;
                width: 128px;
            }
            margin-right: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            @include breakpoint(mobile) {
                width: 100px;
            }
            &--light {
                filter: invert(1);
            }
            @include transition;
        }
    }
}

.main {
    overflow: hidden;
    &--light {
        background-color: white;
        background-image: url("../../Assets/img/site/mca-ayim/grid-light.jpg");
    }
    &--dark {
        background-color: $darker-gray;
        background-image: url("../../Assets/img/site/mca-ayim/grid-dark.jpg");
    }
    @include transition;
}
</style>