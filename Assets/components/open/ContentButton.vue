<template>
    <a 
        :href="linkSync"
        :target="externalSync ? '_blank' : '_self'"
        class="content_button"
    >
        <img 
            v-if="imgSrcSync"
            class="content_button__ico" 
            :src="imgSrcSync"
        >
        <div class="content_button_text">
            <slot />
        </div>
    </a>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";

@Component({})
export default class ContentButton extends Vue {
    @PropSync("link", { type: String, default: "#" }) linkSync!: string;
    @PropSync("external", { type: Boolean, default: false }) externalSync!: boolean;
    @PropSync("imgSrc", { type: String, default : "" }) imgSrcSync!: string;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.content_button {
    cursor: pointer;
    display: flex;
    gap: 5px;
    flex-grow: 1;
    justify-content: center;
    align-items: center;
    background-color: #545454;
    color: #FFFFFF;
    min-height: 30px;
    padding: 5px;
    text-shadow: none;

    &:hover, &--active {
        background-color: $open-red;
        color: #181818;
    }

    &:hover {
        text-decoration: none;
    }

    &_text {
        vertical-align: middle;
        text-align: center;
        font-weight: 600;
    }

    &--margin {
        margin: 15px 0px 15px 0px;
    }

    &--noflex {
        flex: none;
    }

    &--nowrap {
        white-space: nowrap;
    }

    &--red {
        color: #181818;
        background-color: $open-red;
    }

    &--red_sm {
        color: #181818;
        background-color: $open-red;
        max-width: 7.5rem;
        margin: 10px 0px 10px 0px;
    }

    &--red_lg {
        color: #181818;
        background-color: $open-red;
        font-size: $font-lg;
        font-weight: 400;
        line-height: 2rem;
        vertical-align: middle;
    }

    &--red:hover {
        background-color: #CD2443;
    }

    &--red_outline {
        background-color: rgba(0, 0, 0, 0);
        border: 1px solid $open-red;
        color: $open-red;
    }

    &--red_outline:hover {
        color: #181818;
    }

    &--header_button {
        min-width: 150px;
        padding: 5px;
    }

    &--disabled, &--disabled:hover {
        cursor: not-allowed;
        color: #545454;
        background-color: rgba(0, 0, 0, 0);
        border: 1px solid #545454;
    }

    &--font_sm {
        font-size: $font-sm;
    }
}
</style>