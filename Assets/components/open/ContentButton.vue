<template>
    <a 
        :href="linkSync"
        :target="externalSync ? '_blank' : '_self'"
        class="content_button"
    >
        <div class="content_button_text">
            <slot />
        </div>
    </a>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";

@Component({
    components: {
    },
})

export default class ContentButton extends Vue {
    @PropSync("link", { type: String, default: "#" }) linkSync!: string;
    @PropSync("external", { type: Boolean, default: false }) externalSync!: boolean;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.content_button {
    cursor: pointer;
    display: flex;
    flex-grow: 1;
    justify-content: center;
    align-items: center;
    background-color: #545454;
    color: #FFFFFF;
    margin: 15px 0px 15px 0px;
    min-height: 30px;
    padding: 5px;

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

    &--right_margin {
        margin: 15px 0px 15px 10px;
    }

    &--right_margin_bottom {
        margin: 15px 0px 0px 10px;
    }

    &--bottom_margin {
        flex-grow: 0;
        margin: 0px 0px 15px 0px;
    }

    &--bottom_margin:last-child {
        margin: 0px 0 0 0;
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
        font-family: $font-commuterssans;
        font-size: $font-lg;
        font-weight: 400;
        line-height: 2rem;
        vertical-align: middle;
    }

    &--red:hover {
        color: #EBEBEB;
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
        margin: 15px 0px 15px 20px;
        min-width: 150px;
        height: 30px;
        padding: 5px;
    }

    &--disabled {
        cursor: not-allowed;
        color: #545454;
        background-color: rgba(0, 0, 0, 0);
        border: 1px solid #545454
    }

    &--disabled:hover {
        cursor: not-allowed;
        color: #545454;
        background-color: rgba(0, 0, 0, 0);
        border: 1px solid #545454
    }
}
</style>