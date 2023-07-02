<template>
    <div class="data">
        <div class="data__title">
            <slot name="title" />
        </div>
        <div class="data__value">
            <slot name="value" />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component({
    components: {
    },
})

export default class InfoData extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.data {
    display: flex;
    justify-content: space-between;
    margin: 20px 0 0 0;

    &__title {
        color: $open-red;
        font-family: $font-ggsans;
        font-weight: 700;
        line-height: 25px;
        float: left;
    }

    &__value {
        color: #EBEBEB;
        font-family: $font-ggsans;
        font-weight: 800;
        font-size: $font-lg;
        line-height: 25px;
        text-align: right;
        float: right;
    }
}

.data:first-child {
    margin: 0 0 0 0;
}
</style>