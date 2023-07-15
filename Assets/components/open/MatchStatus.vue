<template>
    <div class="status">
        <slot />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component({
    components: {
    },
})

export default class MatchStatus extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.status {
    font-family: $font-swis721;
    font-size: $font-sm;
    color: $darkest-gray;
    text-align: center;
    font-weight: 700;
    padding: 1.75px 3px;
    width: 75px;

    &--not_started {
        color: $white;
        background-color: #545454;
    }

    &--completed {
        background-color: $open-red;
    }

    &--ongoing {
        background-color: $white;
    }
}
</style>