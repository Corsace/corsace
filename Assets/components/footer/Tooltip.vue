<template>
    <div class="tooltip">
        <slot name="icon" />
        <span
            class="tooltip__text"
            :class="`tooltip__text--${site}`"
        >
            <slot />
        </span>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

@Component
export default class Tooltip extends Vue {

    @State site!: string;

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.tooltip {
    position: relative;
    display: flex;

    &__text {
        &--mca-ayim {
            background-color: $alt-blue;
            &::after {
                border-top-color: $alt-blue;
            }
        }
        &--corsace {
            background-color: $pink;
            &::after {
                border-top-color: $pink;
            }
        }

        &--open {
            background-color: $open-red;
            &::after {
                border-top-color: $open-red;
            }
        }

        opacity: 0;
        width: 50px;
        color: #fff;
        text-align: center;
        padding: 5px 0px;
        font-size: 11px;
        font-style: normal;
        font-family: "Swis721";
        font-weight: 400;
        line-height: 13px;
        text-align: center;
        
        position: absolute;
        z-index: 1;
        bottom: calc(33px + 10px);
        left: 50%;
        margin-left: -30px;

        &::after {
            border-bottom-color: transparent;
            border-left-color: transparent;
            border-right-color: transparent;
            content: " ";
            position: absolute;
            top: 85%; /* At the bottom of the tooltip */
            left: 50%;
            margin-left: -12px;
            border-width: 12px;
            border-style: solid;
        }
    }

    &:hover .tooltip__text {
        opacity: 1;
    }
}
</style>
