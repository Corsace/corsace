<template>
    <div
        class="open_button"
        :class="{'open_button--disabled': disabledSync}"
    >
        <div 
            v-if="disabledSync"
            class="open_button__child open_button__child--disabled open_button__content open_button__content--xl"
        >
            CURRENTLY UNAVAILABLE
        </div>
        <NuxtLink
            v-else-if="!externalSync"
            :to="linkSync"
            class="open_button__child"
        >
            <div class="open_button__content">
                <div class="open_button__content--xl">
                    <slot name="title" />
                </div>
                <hr class="line--red">
                <slot />
            </div>
        </NuxtLink>
        <a
            v-else
            :href="linkSync" 
            class="open_button__child"
        >
            <div 
                v-if="linkSync !== '#'"
                class="open_button__content"
            >
                <div class="open_button__content--xl">
                    <slot name="title" />
                </div>
                <hr class="line--red">
                <slot />
            </div>
        </a>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";

@Component
export default class OpenButton extends Vue {
    @PropSync("link", { type: String, default : "#" }) linkSync!: string;
    @PropSync("disabled", { type: Boolean, default : false }) disabledSync!: boolean;
    @PropSync("external", { type: Boolean, default : false }) externalSync!: boolean;
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.open_button {
    margin: 50px 0px;
    height: 112px;
    border-radius: 9px;
    background: linear-gradient(0deg, #555555 100%, #575757 75.26%, #575757 66.67%, #5B5B5B 0%);
    padding: 1px;

    &__child {
        display: block;
        background-image: url('../../img/site/open/checkers-bg.png'), linear-gradient(0deg, $dark -32.92%, #2F2F2F 84.43%);
        background-repeat: no-repeat;
        background-position: bottom 0px right 0px;
        border-radius: 8px; /* reduce radius to keep within parent div */
        height: 110px;
        box-shadow: 0px 4px 4px 0px #00000040;

        &:hover {
            text-decoration: none;
        }

        &--disabled {
            background-image: url('../../img/site/open/checkers-bg.png'), linear-gradient(0deg, $dark, $dark);

            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    &__content {
        position: relative;
        color: $white;
        padding: 20px 20px;
        text-align: start;
        font-weight: 600;

        &--xl {
            font-size: $font-xl;
            font-weight: bold;
        }
    }

    &--disabled {
        cursor: not-allowed;
        opacity: 0.3;
    }
}
</style>