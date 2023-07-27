<template>
    <div class="open_title">
        <div class="open_title_group">
            <div class="open_title_group__text">
                <slot />
            </div>
            <div class="open_title_group__selector">
                <slot 
                    name="selector" 
                />
            </div>
            <div class="open_title_group__button_group">
                <slot 
                    name="buttons"
                />
            </div>
        </div>
        <hr class="line--red line--bottom-space">
        <hr class="line--red line--bottom-space">
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
        
        &__text{
            font-family: $font-commuterssans;
            font-weight: 400;
            font-size: $font-title;
        }
        &__button {
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            flex-direction: row-reverse;
            background-color: $open-red;
            margin: 15px 0px 15px 20px;
            min-width: 150px;
            height: 30px;
            padding: 5px;
            &:hover {
                text-decoration: none;
            }
            &_group {
                display: flex;
                flex-direction: row;
            }
            &_text {
                color: $open-dark;
                font-weight: 600;
            }
            &_ico {
                vertical-align: -10%;
            }
        }
    }
}
</style>