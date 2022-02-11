<template>
    <div 
        class="theme"
        @click="setTheme()"
    >
        {{ viewTheme === "light" ? "sun" : "moon" }}
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

@Component
export default class ThemeSwitcher extends Vue {

    @State viewTheme!: "light" | "dark";

    setTheme (): void {
        this.$store.dispatch("updateViewTheme", this.viewTheme === "light" ? "dark" : "light");
    }
}
</script>

<style lang="scss">
.theme {
    display: flex;
    align-items: center;
    margin: auto 30px;

    cursor: pointer;
}
</style>
