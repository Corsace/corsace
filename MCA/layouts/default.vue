<template>
    <div class="layout layout--mca">
        <the-header 
            :site="'mca'"
            class="mcaayim__header"
        >
            Lol mca funny
        </the-header>

        <nuxt class="main" />
        
        <the-footer class="mcaayim__footer">
            <img
                class="footer-nav__brand-name"
                :class="`footer-nav__brand-name--${viewTheme}`"
                src="../../Assets/img/ayim-mca/site/corsace_text.png"
                alt=""
            >
        </the-footer>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import TheHeader from "../../Assets/components/Header/TheHeader.vue";
import TheFooter from "../../Assets/components/Footer/TheFooter.vue";

@Component({
    components: {
        TheHeader,
        TheFooter,
    },
    middleware: "mca",
})
export default class Default extends Vue {

    @State viewTheme!: "light" | "dark";

    async mounted () {
        await this.$store.dispatch("setInitialData");
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables'; 

.mcaayim__header {
    border-bottom: 1px solid $blue;
}

.mcaayim__footer {
    border-top: 1px solid $blue;
}

.footer-nav {
    &__brand {

        &-name {
            object-fit: contain;
            width: 128px;
            margin-right: auto;
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
</style>