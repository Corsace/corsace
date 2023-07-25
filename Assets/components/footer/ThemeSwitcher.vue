<template>
    <div
        class="theme"
        :class="[
            `theme--${viewTheme}`,
            `theme__${getMode()}`
        ]"
        @click="setTheme()"
    >
        <div class="theme__border_left" />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

@Component
export default class ThemeSwitcher extends Vue {

    @State viewTheme!: "light" | "dark";
    @State site!: string;

    setTheme (): void {
        this.$store.dispatch("updateViewTheme", this.viewTheme === "light" ? "dark" : "light");
    }

    getMode () {
        if (this.site === "mca-ayim" && this.$store.state["mca-ayim"].selectedMode) {
            return this.$store.state["mca-ayim"].selectedMode;
        }
        return this.site;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';

.theme {
    cursor: pointer;

    background-position: center;
    background-repeat: no-repeat;
    background-size: 40px;
    width: 40px;
    position: relative;

    @include breakpoint(laptop) {
        background-size: 19.8px;
        width: 50px;
    }
    
    @each $mode in $modes {
        &__#{$mode} {
            &:hover {
                background-color: var(--#{$mode});
            }
        }
    }
    
    &__corsace {
        &:hover {
            background-color: $pink;
        }
    }
    
    &__border_left {
        position: absolute;
        top: 20%;
        bottom: 20%;
        border-left: 1px solid rgba(217, 217, 217, 0.15);
    }

    &--light {
        background-image: url("../../img/sun.png");
    }

    &--dark {
        background-image: url("../../img/moon.png");
    }
}
</style>
