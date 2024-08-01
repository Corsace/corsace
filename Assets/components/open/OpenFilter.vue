<template>
    <div class="open_filter">
        <div
            class="open_filter__selected"
            @click="visibleDropdown = !visibleDropdown"
        >
            <div class="open_filter__selected__text">
                {{ currFilterSync }}
            </div>
            <div class="open_filter__selected__arrow_holder">
                <div
                    class="triangle open_filter__selected__arrow"
                    :class="{ 'open_filter__selected__arrow--active': visibleDropdown }"
                />
            </div>
        </div>
        <div
            v-if="visibleDropdown"
            class="open_filter__dropdown"
        >
            <div
                v-for="filter in filtersSync"
                :key="filter"
                class="open_filter__dropdown__item"
                :class="{ 'open_filter__dropdown__item--active': currFilterSync === filter }"
                @click="currFilterSync = filter; visibleDropdown = false"
            >
                {{ filter }}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";

@Component({})
export default class OpenFilter extends Vue {
    @PropSync("currFilter", { type: String }) currFilterSync!: string;
    @PropSync("filters", { type: Array }) filtersSync!: string[];

    visibleDropdown = false;
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.open_filter {
    background-color: $open-red;
    position: relative;
    white-space: nowrap;

    &__selected {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        color: $open-dark;
        font-weight: bold;
        font-size: $font-base;

        &__text {
            padding: 5px 20px;
            &:hover {
                background-color: #CD2443;
            }
        }

        &__arrow {
            position: relative;

            &--active {
                border-top: 0;
                border-bottom: 10px solid $open-dark;
            }

            &_holder {
                display: flex;
                align-items: center;
                height: 100%;
                padding: 10px;
                background-color: $open-red;

                &:hover {
                    background-color: #CD2443;
                }
            }
        }
    }

    &__dropdown {
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        font-weight: bold;
        color: $open-dark;
        background-color: $open-red;
        display: flex;
        flex-direction: column;
        gap: 1px;
        z-index: 3;

        &__item {
            padding: 10px 20px;
            cursor: pointer;
            text-align: left;

            &--active, &:hover {
                background-color: #CD2443;
            }
        }
    }
}
</style>