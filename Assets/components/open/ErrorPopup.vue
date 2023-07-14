<template>
    <div class="error_popup">
        <div class="error_popup_text">
            <slot />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import MappoolSlotDropdown from "./MappoolSlotDropdown.vue";
import MappoolMapBanner from "./MappoolMapBanner.vue";
import { Mappool } from "../../../Interfaces/mappool";

@Component({
    components: {
        MappoolSlotDropdown,
        MappoolMapBanner,
    },
})
export default class MappoolView extends Vue {
    @PropSync("pool", { default: null }) readonly poolData!: Mappool | null;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.error_popup{
    padding: 5px;
    position: fixed;
    opacity: 1;
    top: 0;
    left: 0;
    z-index: 1;
    background-color: rgba($color: $open-dark, $alpha: 0.7);
    min-height: 100vh;
    min-width: 100vw;

    &_text {
        display: flex;
        flex-direction: column;
        align-items: center;
        border: 1px solid $open-red;
        padding: 15px;
        position: fixed;
        width: 700px;
        height: auto;
        top: 50%;
        left: calc(50% - 350px);
        font-family: $font-ggsans;
        font-size: $font-xl;
        font-weight: 500;
        text-align: center;
    }
}
</style>