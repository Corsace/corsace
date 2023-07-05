<template>
    <div class="scores">
        <div class="scores__sub_header">
            <div class="scores__sub_header_subtext">
                FILTERS
            </div>
            <div class="scores__sub_header_item scores__sub_header_item--active">
                AVERAGE
            </div>
            <div class="scores__sub_header_item">
                SUM
            </div>
            <div class="scores__sub_header_item">
                %AVG
            </div>
            <div class="scores__sub_header_item">
                SEEDING
            </div>
        </div>
        <hr class="line--red line--bottom-space">
        <div class="scores__wrapper">
            <table class="scores__table">
                <tbody>
                    <tr>
                        <th>TEAM</th>
                        <th>BEST</th>
                        <th>WORST</th>
                        <th>AVG.</th>
                        <th>NM1</th>
                        <th style="width: 15.5px;">NM2</th>
                        <th style="width: 14.5px;">NM3</th>
                        <th>NM4</th>
                        <th>NM5</th>
                        <th>HD1</th>
                        <th>HD2</th>
                        <th>HR1</th>
                        <th>HR2</th>
                        <th>DT1</th>
                        <th>DT2</th>
                    </tr>
                    <tr>
                        <td>WHISPERING ALMOND</td>
                        <td>DT1</td>
                        <td>NM4</td>
                        <td>999999</td>
                        <td class="scores__table--highlight">999999</td>
                        <td>999999</td>
                        <td class="scores__table--highlight">999999</td>
                        <td class="scores__table--highlight">999999</td>
                        <td class="scores__table--highlight">999999</td>
                        <td>999999</td>
                        <td>999999</td>
                        <td>999999</td>
                        <td>999999</td>
                        <td>999999</td>
                        <td>999999</td>
                    </tr>
                    <tr>
                        <td>WHISPERING ALMOND</td>
                        <td>DT1</td>
                        <td>NM4</td>
                        <td>999999</td>
                        <td class="scores__table--highlight">999999</td>
                        <td>999999</td>
                        <td class="scores__table--highlight">999999</td>
                        <td class="scores__table--highlight">999999</td>
                        <td class="scores__table--highlight">999999</td>
                        <td>999999</td>
                        <td>999999</td>
                        <td>999999</td>
                        <td>999999</td>
                        <td>999999</td>
                        <td>999999</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";


@Component({
    components: {

    },
})
export default class ScoresView extends Vue {

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
.scores {
    position: relative;

    &__sub_header {
        display: flex;
        justify-content: center;
        width: 100%;
        top: 0px;
        background-color: rgba(0, 0, 0, 0);
        color: #C0C0C0;

        &_item {
            position: relative;
            display: flex;
            justify-content: center;

            cursor: pointer;
            width: auto;
            text-decoration: none;
            font-family: $font-ggsans;
            font-weight: 500;
            padding: 0 30px 5px 30px;

            &:hover, &--active {
                color: $open-red;
            }

            &--active::after {
                content: "";
                position: absolute;
                top: calc(50% - 10px/2);
                right: calc(100% - 20px);
                width: 4.5px;
                height: 4.5px;
                transform: rotate(-45deg);
                background-color: $open-red;
            }
        }

        &_subtext {
            display: flex;
            align-items: center;
            font-family: $font-swis721;
            font-weight: 400;
            font-size: $font-sm;
            padding: 0 80px 5px 30px;
        }
    }

    &__wrapper {
        padding: 0;
        height: 100%;
        border-left: 1px solid #383838;
        border-right: 1px solid #383838;
        overflow: scroll;
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }

    &__wrapper::-webkit-scrollbar {
        display: none; /*Chrome*/
    }
    &__table {
        font-family: $font-ggsans;
        width: 100%;
        border-collapse: collapse;
        box-sizing: border-box;
        margin-top: 15px;

        &--highlight{
            color: #FBBA20;
        }
    }

    &__table th {
        font-size: $font-sm;
        font-weight: 700;
        border-bottom: 1px solid #383838;
        padding: 15px 5px;
        border-left: 1px solid #383838;
    }

    &__table th:first-child {
        border-left: 0;
        border-right: 0;
    }

    &__table td {
        font-size: 0.70rem; /* i tried $font-xsm but its too small*/
        font-weight: 600;
        text-align: center;
        padding: 15px 20px;
        border-bottom: 1px solid $open-red;
        border-left: 1px solid #383838;
    }

    &__table td:first-child {
        border-left: 0;
        border-right: 0;
    }
}
</style>