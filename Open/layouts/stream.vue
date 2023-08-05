<template>
    <nuxt 
        class="stream"
    />
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component({
    middleware: "stream",
})
export default class StreamLayout extends Vue {}
</script>

<style lang="scss">
.stream {
    height: 1080px;
    width: 1920px;
    display: flex;
}
</style>
