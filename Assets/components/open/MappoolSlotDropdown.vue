<template>
    <div class="mappool_slot_dropdown">
        <a class="mappool_slot_dropdown__header">
            <div class="mappool_slot_dropdown__triangle" />
            <slot />
        </a>
        <div class="mappool_slot_dropdown__content">
            <slot name="content" />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class MappoolSlotDropdown extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.mappool_slot_dropdown {
    &__header {
        cursor: pointer;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        min-width: 100%;
        background: linear-gradient(180deg, #121212 0%, #1C1C1C 100%);
        border-bottom: 1px solid $open-red;
        padding: 10px;
        margin: 10px 0px;
        color: $white;
        font-weight:600;
    }

    &__triangle {
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 12px 7.5px 0 7.5px;
        border-color: $open-red transparent transparent transparent;
        margin-top: 5px;
        margin-right: 10px;
    }

    &__content {  
        background-color: grey;
        overflow:hidden;
        height: auto;
        max-height: 30vh;

        &.collapse {
            max-height: 0;
        }
    }
}

</style>