<template>
    <div class="qualifier-header">
        <a 
            href="/"
            class="qualifier-header item active"
        >
            MAPPOOL
        </a>
        <a 
            href="/"
            class="qualifier-header item"
        >
            QUALIFIERS
        </a>
        <a 
            href="/"
            class="qualifier-header item"
        >
            SCORES
        </a>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class QualifiersSubheader extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.qualifier-header {
    display: flex;
    justify-content: center;
    width: 100%;
    position: relative;
    top: 0px;
    background-color: $open-red;
    color: $open-dark;
}

.qualifier-header .item {
    width: auto;
    text-decoration: none;
    font-weight: bold;
    padding: 5px 90px;
}

.qualifier-header .item:hover {
    color: #EBEBEB;
}

.qualifier-header .item.active {
    color: #EBEBEB;
}

.qualifier-header .item.active::after {
    content: "";
    position: absolute;
    top: calc(50% - 4.5px/2);
    right: calc(100% - 4.5em);
    width: 4.5px;
    height: 4.5px;
    transform: rotate(-45deg);
    background-color: #EBEBEB;
}
</style>