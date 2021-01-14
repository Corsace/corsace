<template>
    <div class="choice">
        <slot />
        
        <div 
            class="choice__selection"
            @click="$emit('choose')"
        >
            <div 
                class="choice__selection-box" 
                :class="{ 'choice__selection-box--chosen': choice.chosen }"
            >
                <img
                    class="choice__selection-check"
                    :class="{ 'choice__selection-check--chosen': choice.chosen }"
                    src="../../Assets/img/ayim-mca/site/checkmark.png"
                >
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
export default class BaseChoiceCard extends Vue {

    @Prop({ type: Object, default: () => ({}) }) readonly choice!: Record<string, any>;

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.choice {
    @extend %flex-box;
    flex: 1;
    padding: 0;
    min-width: 350px;
    box-shadow: 0 0 8px rgba(255,255,255,0.25);

    cursor: pointer;
}

.choice__selection {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;

    padding-bottom: 4%;

    &-box {
        height: 35px;
        width: 35px;
    
        border: 4px solid rgba(255, 255, 255, 0.3); 
        border-radius: 5px;

        @include transition;
        
        &--chosen {
            border-color: white;
            box-shadow: 0 0 4px white, inset 0 0 4px white;
        }
    }

    &-check {
        width: 100%;
        height: 100%;

        opacity: 0;

        @include transition;

        &--chosen {
            opacity: 1
        }
    }
}

.choice__info {
    flex: 5;
    padding: 15px;
    border-radius: 10px 0 0 10px;

    background-size: cover;
    background-position: 34% 30%;
    overflow: hidden;

    color: white;
    text-decoration: none;

    &-title {
        text-shadow: 0 0 2px white;
        font-weight: 500;
        font-size: $font-lg;
        @extend %text-wrap;
    }

    &-artist {
        text-shadow: 0 0 4px white;
        font-size: $font-base;
        @extend %text-wrap;
    }

    &-hoster {
        text-shadow: 0 0 4px white;
        font-style: italic;
        @extend %text-wrap;
    }
}
</style>
