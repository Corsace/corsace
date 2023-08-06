<template>
    <a 
        :href="linkSync"
        :target="externalSync ? '_blank' : '_self'"
        class="icon_button__button"
    >
        <div class="icon_button__button--icon">
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

export default class IconButton extends Vue {
    @PropSync("link", { type: String, default: "#" }) linkSync!: string;
    @PropSync("external", { type: Boolean, default: false }) externalSync!: boolean;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.icon_button {
    &__button {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 27px;
        height: 27px;

        background-color: $open-red;

        &--icon {
            width: 19.1px;
            height: 21.07px;
        }
    }
}
</style>