<template>
    <div class="open_title">
        <div class="open_title_group">
            <div class="open_title_group__text">
                <slot />
            </div>
            
            <div class="open_title_group__right">
                <slot 
                    name="right" 
                />
            </div>
        </div>
        <slot
            name="separator"
        >
            <hr class="line--red line--bottom-space">
        </slot>
    </div>
</template>

<script lang="ts">
import { Vue } from "vue-property-decorator";
export default class OpenTitle extends Vue {
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.open_title {
    &_group {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        flex-wrap: wrap;
        
        &__text {
            font-family: $font-zurich;
            font-size: $font-title;
        }

        &__right {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;
        }
    }
}
</style>