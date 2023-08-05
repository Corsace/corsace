<template>
    <nuxt />
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component({
    middleware: "stream",
})
export default class StreamLayout extends Vue {}
</script>
