<template>
    <div
        class="theme"
        :class="[
            `theme--${viewTheme}`,
            `theme__${getMode()}`
        ]"
        @click="setTheme()"
    />
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
    @include breakpoint(laptop) {
        background-size: 50px;
        width: 70px;
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

    &--light {
        background-image: url("../../img/sun.png");
    }

    &--dark {
        background-image: url("../../img/moon.png");
    }
}
</style>
