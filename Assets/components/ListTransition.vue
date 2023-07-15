<template>
    <transition-group
        name="list"
        tag="div"
        appear
    >
        <slot />
    </transition-group>
</template>


<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class ListTransition extends Vue {

}
</script>

<style lang="scss">

.list {
    &-move {
        transition: all .4s ease-in-out;
    }

    &-leave-active {
        position: absolute !important;
    }

    &-enter,
    &-leave-to {
        opacity: 0;
    }
}

</style>
