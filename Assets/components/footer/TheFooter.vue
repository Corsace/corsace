<template>
    <div 
        class="footer"
        :class="`footer--${viewTheme}`"
    >
        <slot />
        
        <language-switcher />

        <theme-switcher />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import LanguageSwitcher from "./LanguageSwitcher.vue";
import ThemeSwitcher from "./ThemeSwitcher.vue";

@Component({
    components: {
        LanguageSwitcher,
        ThemeSwitcher,
    },
})
export default class TheFooter extends Vue {
    @State viewTheme!: "light" | "dark";
}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';

.footer {
    &--light {
        background-color: white;
        color: black;
    }
    &--dark {
        background-color: $dark;
        color: white;
    }
    bottom: 0;

    font-size: $font-xl;

    width: 100%;
    height: 50px;
    display: flex;
}
</style>