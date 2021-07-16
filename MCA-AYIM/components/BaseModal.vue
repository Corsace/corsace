<template>
    <div class="modal">
        <div class="modal-container">
            <div class="modal-content">
                <a
                    href="#"
                    class="modal__close"
                    @click="$emit('close')"
                >
                    ✕
                </a>
                <div class="modal__title">
                    {{ title }}
                </div>
            
                <slot />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
export default class BaseModal extends Vue {

    @Prop({ type: String, default: "" }) readonly title!: string;

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';

.modal {
    position: fixed;
    left: 0;
    bottom: 0;

    width: 100%;
    height: 100%;
    
    background-color: rgba(0,0,0,0.95);
    
    z-index: 100;
    outline: 0;
    overflow-x: hidden;
    overflow-y: auto;

    &-container {
        position: relative;
        height: 100%;
        max-width: 100%;
        margin: auto;
        display: flex;
        align-items: flex-start;

        @include breakpoint(tablet) {
            max-width: $breakpoint-lg;
            align-items: center;
        }
    }

    &-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1 1 auto;

        width: 100%;

        position: relative;
        
        text-align: center;
        text-shadow: 0px 0px 16px #ffffff;
    }
}

.modal__close {
    font-size: 3rem;
    align-self: flex-end;
}

.modal__title {
    font-family: $font-display;
    font-size: 3rem;
    margin-bottom: 30px;
}

</style>
