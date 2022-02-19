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
import { State, namespace } from "vuex-class";

const mcaAyimModule = namespace("mca-ayim");

@Component
export default class ThemeSwitcher extends Vue {

    @State viewTheme!: "light" | "dark";
    
    @mcaAyimModule.State selectedMode?: string;

    setTheme (): void {
        this.$store.dispatch("updateViewTheme", this.viewTheme === "light" ? "dark" : "light");
    }

    getMode () {
        if (this.selectedMode)
            return this.selectedMode;
        return "corsace";
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';

.theme {
    cursor: pointer;

    width: 70px;

    background-position: center;
    background-repeat: no-repeat;
    background-size: 50px;

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
