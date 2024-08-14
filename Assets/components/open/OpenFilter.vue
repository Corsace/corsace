<template>
    <div class="open_filter">
        {{ $t("open.components.filter.name") }}
        <div
            class="open_filter__icon"
            @click.stop="toggleDropdown()"
        >
            <div class="open_filter__icon_square" />
            <div class="open_filter__icon_square" />
            <div class="open_filter__icon_square" />
            <div class="open_filter__icon_square" />
            <div
                v-if="visibleDropdown"
                class="open_filter__dropdown"
                @click.stop
            >
                <div class="open_filter__dropdown_triangle_up" />
                <div class="open_filter__dropdown_header">
                    <div>VIEW</div>
                    <div>SORT</div>
                </div>
                <div
                    class="open_filter__dropdown__content"
                >
                    <div class="open_filter__dropdown__view_content">
                        <div
                            ref="diamondLeft"
                            class="open_filter__diamond open_filter__diamond--left"
                        />
                        <slot name="view" />
                    </div>
                    <div class="open_filter__dropdown__sort_content">
                        <div
                            ref="diamondRight"
                            class="open_filter__diamond open_filter__diamond--right"
                        />
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

    updateDiamondPosition (side: "left" | "right", div: HTMLElement) {
        const diamond = side === "left" ? this.$refs.diamondLeft : this.$refs.diamondRight;
        if (diamond instanceof HTMLElement) {
            const parent = diamond.parentElement!;
            const parentRect = parent.getBoundingClientRect();
            const divRect = div.getBoundingClientRect();
            const offsetY = divRect.top - parentRect.top + divRect.height / 2;
            diamond.style.opacity = "1";
            diamond.style.top = `${offsetY}px`;
        }
    }

    diamondToSelectedValue (side: "left" | "right") {
        const diamond = side === "left" ? this.$refs.diamondLeft : this.$refs.diamondRight;
        if (diamond instanceof HTMLElement) {
            // Check if the data in the slot has an html element with a class of open_filter__selected
            const selected = diamond.parentElement!.querySelector(".open_filter__selected");
            if (selected instanceof HTMLElement) {
                const parent = diamond.parentElement!;
                const parentRect = parent.getBoundingClientRect();
                const selectedRect = selected.getBoundingClientRect();
                const offsetY = selectedRect.top - parentRect.top + selectedRect.height / 2;
                diamond.style.opacity = "1";
                diamond.style.top = `${offsetY}px`;
            } else
                diamond.style.opacity = "0";
        }
    }

    setListeners (element: HTMLElement, side: "left" | "right") {
        const updatePosition = () => this.updateDiamondPosition(side, element);
        const resetPosition = () => this.diamondToSelectedValue(side);

        element.addEventListener("mouseenter", updatePosition);
        element.addEventListener("mouseleave", resetPosition);
    }

    toggleDropdown () {
        this.visibleDropdown = !this.visibleDropdown;
        this.$nextTick(() => {
            if (!(this.$refs.diamondLeft instanceof HTMLElement) || !(this.$refs.diamondRight instanceof HTMLElement))
                return;

            this.diamondToSelectedValue("left");
            this.diamondToSelectedValue("right");
            
            Array.from(this.$refs.diamondLeft.parentElement!.children).filter(c => {
                if (!(c instanceof HTMLElement))
                    return false;
                return !c.classList.contains("open_filter__diamond");
            }).forEach((c) => this.setListeners(c as HTMLElement, "left"));
            Array.from(this.$refs.diamondRight.parentElement!.children).filter(c => {
                if (!(c instanceof HTMLElement))
                    return false;
                return !c.classList.contains("open_filter__diamond");
            }).forEach((c) => this.setListeners(c as HTMLElement, "right"));
        });
    }

    mounted () {
        document.addEventListener("click", () => this.visibleDropdown = false);
    }

    updated () {
        if (this.visibleDropdown) {
            this.diamondToSelectedValue("left");
            this.diamondToSelectedValue("right");
        }
    }
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
            background-color: $open-red;
            color: $open-dark;
            width: 100%;
            overflow: hidden;
            padding: 10px 20px;
        }

        &__view_content, &__sort_content {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 50%;
            white-space: normal;

            & div {
                cursor: pointer;
                text-transform: uppercase;
            }
        }

        &__view_content {
            align-items: flex-start;
        }

        &__sort_content {
            align-items: flex-end;
        }

        &_footer {
            width: 100%;
            height: 10px;
            background: linear-gradient(90deg, #171B1E 0%, #2F2F2F 100%);
        }
    }

    &__diamond {
        position: absolute;
        height: 5px;
        aspect-ratio: 1/1;
        transform: translateY(-50%) rotate(45deg);
        background-color: $open-dark;

        &--left {
            left: -10px;
        }

        &--right {
            right: -10px;
        }
    }

    &__separator {
        height: 1px;
        width: 100%;
        background-color: $open-dark;
    }

    &__selected {
        position: relative;
        font-weight: bold;
    }

    &__arrows {
        position: absolute;
        display: flex;
        flex-direction: column;
        font-size: $font-xsm;
        line-height: 0.75em;
        color: #CD2443;
        left: -12px;
        top: 0;

        & div {
            transform: scaleX(1.25) scaleY(0.75);
        }

        &--selected {
            color: $open-dark;
        }
    }
}
</style>