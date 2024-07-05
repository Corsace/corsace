<template>
    <div class="sub_header">
        <div
            v-for="selection in selectionsSync"
            :key="selection.value"
            class="sub_header_item"
            :class="{ 'sub_header_item--active': page === selection.value }"
            @click="$emit('update:page', selection.value)"
        >
            {{ selection.text }}
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";
import VueI18n from "vue-i18n";

interface selection {
    text: string | VueI18n.TranslateResult;
    value: string;
}

@Component({})
export default class SubHeader extends Vue {
    @PropSync("selections", { type: Array, default: () => [] as selection[] }) selectionsSync!: selection[];
    @PropSync("currentPage", { type: String, default: "" }) page!: string;
}

</script>

<style lang="scss">
@import '@s-sass/_variables';

.sub_header {
    display: flex;
    justify-content: center;
    width: 100%;
    top: 0px;
    background-color: $open-red;
    color: $open-dark;

    &_item {
        position: relative;
        display: flex;
        justify-content: center;

        cursor: pointer;
        width: auto;
        text-decoration: none;
        font-weight: 700;
        padding: 5px 90px;

        &:hover, &--active {
            color: $white;
        }

        &--active::after {
            content: "";
            position: absolute;
            top: calc(50% - 4.5px/2);
            right: calc(100% - 4.5em);
            width: 4.5px;
            height: 4.5px;
            transform: rotate(-45deg);
            background-color: $white;
        }
    }
}
</style>