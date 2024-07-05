<template>
    <div
        class="open_front_page_button"
        :class="{'open_front_page_button--disabled': disabledSync}"
    >
        <div 
            v-if="disabledSync"
            class="open_front_page_button__child open_front_page_button__content open_front_page_button__child--disabled"
        >
            CURRENTLY UNAVAILABLE
        </div>
        <NuxtLink
            v-else-if="!externalSync"
            :to="linkSync"
            class="open_front_page_button__child"
        >
            <div class="open_front_page_button__content">
                <div 
                    class="open_front_page_button__content--xl"
                    :style="['kr', 'jp'].some(l => l === $i18n.locale) ? {
                        'font-size': '57.56px',
                        'line-height': '51.3px',
                    } : {}"
                >
                    <slot name="title" />
                </div>
                <div class="open_front_page_button__content--text">
                    <slot />
                </div>
            </div>
        </NuxtLink>
        <a
            v-else
            :href="linkSync" 
            class="open_front_page_button__child"
        >
            <div 
                v-if="linkSync !== '#'"
                class="open_front_page_button__content"
            >
                <div 
                    class="open_front_page_button__content--xl"
                    :style="['kr', 'jp'].some(l => l === $i18n.locale) ? {
                        'font-size': '57.56px',
                        'line-height': '51.3px',
                    } : {}"
                >
                    <slot name="title" />
                </div>
                <div class="open_front_page_button__content--text">
                    <slot />
                </div>
            </div>
        </a>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";

@Component
export default class OpenFrontPageButton extends Vue {
    @PropSync("link", { type: String, default : "#" }) linkSync!: string;
    @PropSync("disabled", { type: Boolean, default : false }) disabledSync!: boolean;
    @PropSync("external", { type: Boolean, default : false }) externalSync!: boolean;
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.open_front_page_button {
    margin: 50px 0px;
    height: 112px;
    color: $white;

    &__content {
        position: relative;
        padding: 20px 20px;
        height: 100%;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        overflow: hidden;

        &--xl {
            color: #131313;
            position: absolute;
            font-family: $font-zurich;
            font-size: 80.77px;
            line-height: 38.7px;
            letter-spacing: -0.07em;
            font-weight: 900;
            text-transform: lowercase;
            text-align: left;
            vertical-align: middle;
        }

        &--text {
            z-index: 2;
        }
    }

    &--disabled {
        cursor: not-allowed;
        color: $open-red;
        border: 1px solid $open-red;
        font-weight: bold;
    }

    &__child {
        display: block;
        height: 110px;
        background-color: $open-red;

        &:hover {
            text-decoration: none;
        }

        &--disabled {
            background-color: initial;
            background-image: url('../../img/site/open/checkers-bg.png');
            background-repeat: no-repeat;
            background-position: bottom 0px right 0px;

            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
}
</style>