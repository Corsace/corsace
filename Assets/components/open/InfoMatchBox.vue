<template>
    <div class="info_matchbox">
        <div class="info_matchbox_wrapper">
            <div class="info_matchbox_content">
                <div class="info_matchbox_content__text_title">
                    <slot name="title" />
                </div>
                <div class="info_matchbox_content__text_data">
                    <slot />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component({
    components: {
    },
})

export default class InfoMatchBox extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.info_matchbox {
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #151515 0.01%, #545454 100%);
    padding: 1px;
    margin-top: 10px;
    &_wrapper {
        background: #151515;
        background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUiIGhlaWdodD0iNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGxpbmUgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjQiIHN0cm9rZT0iIzU0NTQ1NCIvPgo8L3N2Zz4K);
        background-position: bottom;
        background-repeat: repeat-x;
    }
    &_content {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        padding: 10px 15px;

        &__text_title {
            color: $open-red;
            font-family: $font-swis721;
            font-weight: 700;
            font-size: small;
            float: left;
            line-height: 20px;
            vertical-align: middle;
        }

        &__text_data {
            color: #EBEBEB;
            font-family: $font-ggsans;
            font-weight: 800;
            float: right;
            text-align: right;
            line-height: 20px;
            vertical-align: middle;
        }
    } 
}
</style>