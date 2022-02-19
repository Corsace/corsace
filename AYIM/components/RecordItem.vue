<template>
    <div class="ayim-layout__item">
        <div class="ayim-item__title ayim-item__title--standard">
            <div class="ayim-item__triangles ayim-item__triangles--standard">
                <span class="triangle" />
                <span class="triangle" />
            </div>
            {{ $t(`ayim.${type}.${title}`) }}
        </div>

        <slot />
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
export default class RecordItem extends Vue {
    
    @Prop({ type: String, required: true }) readonly title!: string;
    @Prop({ type: String, required: true }) readonly type!: string;

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

@mixin mode-lines {
    @each $mode in $modes {
        &--#{$mode} {
            $start: 15%;
            $width: 1.2%;
            $gap: 2%;
            background: linear-gradient(
                120deg, 
                #{$dark} calc(#{$start} - 1px),
                var(--#{$mode}) $start,
                var(--#{$mode}) calc(#{$start} + #{$width} - 1px),
                #{$dark} $start + $width,
                #{$dark} calc(#{$start} + #{$width} + #{$gap} - 1px),
                var(--#{$mode}) $start + $width + $gap,
                var(--#{$mode}) calc(#{$start} + #{$width} * 2 + #{$gap} - 1px),
                #{$dark} $start + $width * 2 + $gap
            );
        }
    }
}

.ayim-item {
    display: flex;
    flex-direction: column;

    &__title {
        @extend %flex-box;
        box-shadow: $gray-shadow;
        align-items: center;
        text-transform: uppercase;
        font-size: $font-lg;

        @include mode-lines;        
    }

    &__triangles {
        @include mode-text-color;
        width: 20%;
        display: flex;

        & .triangle {
            transform: rotate(-90deg);
        }
    }
}
</style>
