<template>
    <div class="open_button">
        <div class="open_button__content">
            <div class="open_button__content--xl">
                <slot name="title" />
            </div>
            <hr class="line--red">
            <slot />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class OpenButton extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.open_button {
    margin: 50px 0px;
    background-image: url('../../img/site/open/checkers-bg.png'), linear-gradient(0deg, #0F0F0F -32.92%, #2F2F2F 84.43%);
    background-repeat: no-repeat;
    background-position: right;
    border-radius: 9px;
    border: 1px solid;
    max-height: 110px;
    border-color: #EBEBEB;
    box-shadow: 0px 4px 4px 0px #00000040;

    &__content {
        color: #EBEBEB;
    padding: 20px 20px;
    text-align: start;
        &--xl {
            font-size: $font-xl;
            font-weight: bold;
        }
    }

}
</style>