<template>
    <div class="open_filter">
        FILTERS
        <div
            class="open_filter__icon"
            @click="visibleDropdown = !visibleDropdown"
        >
            <div class="open_filter__icon_square" />
            <div class="open_filter__icon_square" />
            <div class="open_filter__icon_square" />
            <div class="open_filter__icon_square" />
            <div
                v-if="visibleDropdown"
                class="open_filter__dropdown"
            >
                <div class="open_filter__dropdown_triangle_up" />
                <div class="open_filter__dropdown_header">
                    <div>VIEW</div>
                    <div>SORT</div>
                </div>
                <div
                    class="open_filter__dropdown__content"
                    @click.stop
                >
                    <div class="open_filter__dropdown__view_content">
                        <slot name="view" />
                    </div>
                    <div class="open_filter__dropdown__sort_content">
                        <slot name="sort" />
                    </div>
                </div>
                <div class="open_filter__dropdown_footer" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component({})
export default class OpenFilter extends Vue {
    visibleDropdown = false;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.open_filter {
    white-space: nowrap;
    height: 100%;
    display: flex;
    align-items: center;
    font-stretch: condensed;
    font-size: $font-sm;
    gap: inherit;

    &__icon {
        cursor: pointer;
        position: relative;
        display: flex;
        flex-wrap: wrap;
        flex-direction: column;
        justify-content: space-between;
        gap: calc(100% - 2 * 25% * 100 / 60);
        align-items: center;
        height: 50%;
        aspect-ratio: 1 / 1;

        &_square {
            width: calc(25% * 100 / 60);
            height: calc(25% * 100 / 60);
            background-color: $open-red;
        }

        &:hover {
            & .open_filter__icon_square {
                background-color: #CD2443;
            }   
        }
    }

    &__dropdown {
        cursor: default;
        position: absolute;
        top: calc(100% + 10px);
        font-stretch: normal;
        color: $open-dark;
        display: flex;
        align-items: center;
        flex-direction: column;
        box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
        z-index: 3;

        &_triangle_up {
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-bottom: 10px solid white;
        }

        &_header {
            display: flex;
            justify-content: space-between;
            padding: 5px 20px;
            gap: 125px;
            background-color: white;
            color: $open-red;
            font-weight: bold;
            font-size: $font-base;
        }

        &__content {
            display: flex;
            justify-content: space-between;
            background-color: $open-red;
            color: $open-dark;
            width: 100%;
            overflow: hidden;
            padding: 10px 20px;
        }

        &__view_content, &__sort_content {
            display: flex;
            flex-direction: column;
            gap: 10px;

            & div {
                cursor: pointer;
                text-transform: uppercase;
            }
        }

        &__view_content {
            

            & .open_filter__selected::before {
                left: -10px;
            }
        }

        &__sort_content {
            align-items: flex-end;

            & .open_filter__selected::before {
                right: -10px;
            }
        }

        &_footer {
            width: 100%;
            height: 10px;
            background: linear-gradient(90deg, #171B1E 0%, #2F2F2F 100%);
        }
    }

    &__selected {
        position: relative;
        font-weight: bold;

        &::before {
            content: '';
            position: absolute;
            height: 5px;
            aspect-ratio: 1/1;
            top: 50%;
            transform: translateY(-50%) rotate(45deg);

            background-color: $open-dark;
        }
    }

    &__arrows {
        position: absolute;
        display: flex;
        flex-direction: column;
        font-size: $font-xsm;
        line-height: 1em;
        color: #CD2443;
        left: -15px;
        top: 0;

        &--selected {
            color: $open-dark;
        }
    }
}
</style>