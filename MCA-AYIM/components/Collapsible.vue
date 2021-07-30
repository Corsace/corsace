<template>
    <div 
        class="collapsible collapsible--scrollable"
        :class="{ 'collapsible--expandable': expand }"
    >
        <div
            class="collapsible__title"
            :class="{ 
                'collapsible__title--active': active,
                'collapsible__title--hoverable': clickable && !active
            }"
            @click="activate"
        >
            {{ title }}
        </div>
        <hr 
            class="collapsible__bar"
            :class="`collapsible--${selectedMode}`"
        >

        <transition name="fade">
            <div
                v-if="active"
                class="collapsible__items"
                :class="{ 'collapsible__items-extra': !showExtra }"
            >
                <div
                    v-for="(item, i) in list"
                    :key="i"
                    class="collapsible__info"
                    @click="setTarget(item)"
                >
                    <div
                        :class="[{
                                     'collapsible__name': clickable && !item.inactive,
                                     'collapsible__name--inactive': clickable && item.inactive,
                                     'collapsible__name--active': showExtra && isSelected(item),
                                 }, 
                                 'count' in item && 'maxNominations' in item && item.maxNominations !== 100 && item.count === item.maxNominations ? `collapsible__name--${selectedMode}` : '',
                                 'count' in item && 'maxNominations' in item && item.maxNominations !== 100 && item.count === item.maxNominations && showExtra && isSelected(item) ? `collapsible__name--active--${selectedMode}` : '',

                        ]"
                    >
                        <span class="collapsible__text">
                            {{ categoryName ? $t(`mca.categories.${item.name}.name`) : item.name }}
                            {{ extraTitle(item) }}

                            <hr
                                class="collapsible__info-bar"
                                :class="[
                                    {'collapsible__info-bar--active': showExtra && isSelected(item)},
                                    {'collapsible__info-bar--text': showExtra && isSelected(item)}, 
                                    `collapsible--${selectedMode}`
                                ]"
                            >
                        </span>

                        <hr
                            class="collapsible__info-bar"
                            :class="[
                                {'collapsible__info-bar--active': showExtra && isSelected(item)},
                                {'collapsible__info-bar--space': showExtra && isSelected(item)}, 
                                `collapsible--${selectedMode}`
                            ]"
                        >
                    </div>

                    <template v-if="showExtra">
                        <div
                            v-if="'count' in item && 'maxNominations' in item"
                            class="collapsible__count"
                            :class="[{
                                         'collapsible__count--inactive': clickable && item.inactive,
                                         'collapsible__count--active': isSelected(item)
                                     },
                                     item.maxNominations !== 100 && item.count === item.maxNominations ? `collapsible__count--${selectedMode}` : '',
                                     item.maxNominations !== 100 && item.count === item.maxNominations && isSelected(item) ? `collapsible__count--active--${selectedMode}` : '',
                            ]"
                        >
                            {{ item.maxNominations !== 100 ? item.count + " / " + item.maxNominations : item.count }}
                        </div>
                        <div
                            v-else-if="'type' in item"
                            class="collapsible__count"
                            :class="{'collapsible__count--active': isSelected(item)}"
                        >
                            {{ item.type }}
                        </div>
                    </template>
                </div>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { State } from "vuex-class";

interface SubItem {
    name: string;
    count?: number;
    total?: number;
    type?: string;
    mode?: string;
    [key: string]: any;
}

@Component
export default class Collapsible extends Vue {
    
    @Prop({ type: String, default: "" }) readonly title!: string;
    @Prop({ type: Array, default: () => [] }) readonly list!: SubItem[];
    @Prop(Boolean) readonly active!: boolean;
    @Prop(Boolean) readonly showExtra!: boolean;
    @Prop(Boolean) readonly categoryName!: boolean;
    @Prop(Boolean) readonly scroll!: boolean;
    @Prop(Boolean) readonly expand!: boolean;
    @Prop(Boolean) readonly clickable!: boolean;

    @State selectedMode!: string;

    target: SubItem | null = null;

    extraTitle (item: SubItem): string {
        if (!this.showExtra || !item.maxNominations || "count" in item) return "";
        
        return "- " + item.maxNominations;
    }
    
    mounted () {
        if (this.list.length > 0 && this.active && !this.target) {
            this.target = this.list[0];
            this.$emit("target", this.target);
        }
    }

    activate () {
        if (this.active) return;

        this.$emit("activate");
        this.target = null;
    }

    setTarget (item: SubItem) {
        if (item.inactive) return;

        this.$emit("target", item);

        if (!this.isSelected(item)) {
            this.target = item;
        }
    }

    isSelected (item: SubItem): boolean {
        return this.target?.id === item.id;
    }
        
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';
@import '@s-sass/_partials';

.collapsible {
    @extend %flex-box;
    flex: 1 1 auto;
    flex-direction: column;
    color: $gray;
    white-space: nowrap;
    padding: 15px;
    max-height: 400px;
    overflow: hidden;

    @include transition;

    &--scrollable {
        overflow-y: visible;
        scrollbar-width: thin;
        border-radius: 15px 0 0 15px;;

        &::-webkit-scrollbar {
            width: 7px;
        }

        &::-webkit-scrollbar-thumb {
            background: #5f5f5f;
        }
    }

    &--expandable {
        max-height: initial;
    }

    &__title {
        white-space: normal;
        letter-spacing: -3px;
        font-family: $font-display;
        text-align: center;
        font-size: $font-lg;
        cursor: pointer;

        @include breakpoint(laptop) { 
            font-size: $font-xl;
        }

        @include breakpoint(desktop) { 
            font-size: $font-xxl;
        }

        &--active {
            cursor: default;
        }

        &--active, &--hoverable:hover {
            @include transition;
            color: white;
            text-shadow: 0 0 8px white;
        }
    }

    @include mode-border;
}

.collapsible__bar {
    right: -25%;
    top: -2px;
    position: relative;
    margin: 0;

    @include transition;
}

.collapsible__items {
    position: relative;
    
    &-extra {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
}

.collapsible__info {
    display: flex;
    align-items: center;
    font-size: $font-base;
    @include breakpoint(desktop) { 
        font-size: $font-lg;
    }
    padding-top: 15px;

    &-bar {
        left: 1%;
        right: 0;
        bottom: 0;

        width: 0;
        border-width: 0;
        margin: 0;
        position: absolute;

        @include transition;

        &--active {
            border-width: 1px;
        }

        &--text {
            width: 100%;
        }

        &--space {
            width: 65%;
        }
    }
}

.collapsible__name {
    position: relative;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    @include transition;

    &--active, &:hover {
        text-shadow: 0 0 8px white;
        font-size: 1.088rem;
        font-weight: 500;

        @include breakpoint(desktop) { 
            font-size: 1.3rem;
        }
    }

    @each $mode in $modes {
        &--active--#{$mode}, &--#{$mode}:hover {
            text-shadow: 0 0 8px var(--#{$mode});
        }
    }

    &--inactive {
        opacity: .5;
    }

    @include mode-text-color;
}

.collapsible__text {
    @extend %text-wrap;
    position: relative;
}

.collapsible__count {
    min-width: 52px;
    @include breakpoint(desktop) { 
        min-width: 58px;
    }
    flex: none;

    color: white;
    text-align: center;
    border: 1px solid white;
    border-radius: 7px;

    padding: 5px 9px;

    letter-spacing: 2px;
    cursor: default;
    @include transition;

    &--active {
        background-color: white;
        color: rgba(0, 0, 0, 0.6);
        box-shadow: 0 0 10px white;
    }

    &--inactive {
        opacity: .5;
    }

    @include mode-border;
    @include mode-text-color;

    @each $mode in $modes {
        &--active--#{$mode}, &--#{$mode}:hover {
            background-color: var(--#{$mode});
            color: rgba(0, 0, 0, 0.6);
            box-shadow: 0 0 16px var(--#{$mode});
        }
    }
}

.collapsible__scroll {
    height: 350px;
    top: 16%;
}
</style>
