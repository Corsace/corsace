<template>
    <div class="menuItem">
        <div
            v-if="!isSmall" 
            class="menuItem__dot" 
            :class="`menuItem__dot--${viewTheme} menuItem__dot--${site}`"
        />
        <slot />
    </div>
</template>


<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

@Component
export default class MenuItem extends Vue {
    
    @State site!: string;
    @State viewTheme!: "light" | "dark";

    isSmall = false;

    mounted () {
        if (process.client) {
            this.isSmall = window.innerWidth < 992;
            window.addEventListener("resize", () => this.isSmall = window.innerWidth < 992);
        }
    }
}
</script>

<style lang="scss">
.menuItem {
    display: flex;
    gap: 8px;
    align-items: center;

    &__dot {
        width: 3px;
        height: 3px;
        border-radius: 100%;
        background: black;
        &--dark {
            background: white;
        }

        &--open {
            background: black;
            border-radius: 0;
            width: 5px;
            height: 5px;
        }
    }
}


</style>