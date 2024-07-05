<template>
    <a
        :href="linkSync"
        class="open_button"
    >
        <div class="open_button__text">
            <slot />
        </div>
        <img 
            v-if="imgSrcSync"
            class="open_button__ico" 
            :src="imgSrcSync"
        >
    </a>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";

@Component({})
export default class OpenTitleButton extends Vue {
    @PropSync("link", { type: String, default : "#" }) linkSync!: string;
    @PropSync("imgSrc", { type: String, default : "" }) imgSrcSync!: string;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.open_button {
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    flex-direction: row-reverse;
    background-color: $open-red;
    margin: 15px 0px 15px 20px;
    min-width: 150px;
    height: 30px;
    padding: 5px;

    &:hover {
        text-decoration: none;
    }

    &__text {
        color: $open-dark;
        font-weight: 600;
    }

    &__ico {
        vertical-align: -10%;
    }
}
</style>