<template>
    <div 
        class="collapsible collapsible--scrollable"
        :class="[
            { 'collapsible--expandable': expand },
            `collapsible--${viewTheme}`
        ]"
    >
        <div
            class="collapsible__title"
            :class="[
                `collapsible__title--${viewTheme}`,
                active ? `collapsible__title--active-${viewTheme}` : '',
                clickable ? 'collapsible__title--clickable' : '',
            ]"
            @click="activate"
        >
            {{ title }}
        </div>

        <transition name="fade">
            <div
                v-if="active"
                class="collapsible__items"
                :class="[
                    { 'collapsible__items-extra': !showExtra },
                    `collapsible__items--${viewTheme}`
                ]"
            >
                <div
                    v-for="(item, i) in list"
                    :key="i"
                    class="collapsible__info"
                    :class="{
                        'collapsible__info--centre': !showExtra,
                        'collapsible--clickable': clickable,
                    }"
                    @click="setTarget(item)"
                >
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
                            {{ item.maxNominations !== 100 ? item.count + "/" + item.maxNominations : item.count }}
                        </div>
                        <div
                            v-else-if="'type' in item"
                            class="collapsible__count"
                            :class="{'collapsible__count--active': isSelected(item)}"
                        >
                            {{ item.type }}
                        </div>
                    </template>
                    <div class="collapsible__info--dot" />
                    <div
                        class="collapsible__text"
                        :class="[{
                                     'collapsible__name': clickable && !item.inactive,
                                     'collapsible__name--inactive': clickable && item.inactive,
                                     'collapsible__name--active': showExtra && isSelected(item),
                                 }, 
                                 'count' in item && 'maxNominations' in item && item.maxNominations !== 100 && item.count === item.maxNominations ? `collapsible__name--${selectedMode}` : '',
                                 'count' in item && 'maxNominations' in item && item.maxNominations !== 100 && item.count === item.maxNominations && showExtra && isSelected(item) ? `collapsible__name--active--${selectedMode}` : '',

                        ]"
                    >
                        {{ categoryName ? $t(`mca.categories.${item.name}.name`) : item.name }}
                    </div>
                </div>
            </div>
            <div 
                v-else
                class="collapsible__expand"
                :class="[
                    `collapsible__expand--${viewTheme}`,
                    {'collapsible--clickable': clickable}
                ]"
                @click="activate"
            >
                EXPAND
                <div class="triangle" />
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

interface SubItem {
    name: string;
    count?: number;
    total?: number;
    type?: string;
    mode?: string;
    [key: string]: any;
}

const mcaAyimModule = namespace("mca-ayim");

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

    @State viewTheme!: "light" | "dark";
    @mcaAyimModule.State selectedMode!: string;

    target: SubItem | null = null;
    
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
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    white-space: nowrap;
    padding: 15px;
    max-height: 400px;
    overflow: hidden;

    &--light {
        color: $dark-gray;
    }
    &--dark {
        color: $gray;
    }

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

    &--clickable {
        cursor: pointer;
    }

    &__info {
        display: flex;
        align-items: center;
        width: 100%;
        margin: 10px 0;

        &--centre {
            justify-content: center;
        }

        &--dot {
            height: 10px;
            width: 10px;
            background-color: $blue;
            border-radius: 100%;
            margin: 0 10px;
        }
    }

    &__title {
        font-size: $font-lg;
        @include breakpoint(tablet) { 
            font-size: $font-xl;
        }
        @include breakpoint(laptop) { 
            font-size: $font-xxl;
        }
        @include breakpoint(desktop) { 
            font-size: $font-xxxl;
        }
        text-transform: uppercase;
        text-align: center;
        font-weight: bold;

        position: relative;
        background-color: $blue;
        padding: 15px 50px;
        border-radius: 3px 3px 0 0;

        white-space: nowrap;

        &::after {
            content: "";
            display: block;
            position: absolute;
            width: 100%;
            bottom: -20px;
            left: 0;
            height: 20px;
            background: linear-gradient(-45deg, transparent 75%, $blue 0) 0 50%,
                        linear-gradient(45deg, transparent 75%, $blue 0) 0 50%;
            background-size: 20px 20px;
        }

        &--light {
            color: white;
        }
        &--dark {
            color: black;
        }
    }

    &__items {
        color: $gray;

        border: 1px solid $blue;
        border-radius: 3px;

        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;

        &--light {
            background-color: white;
        }
        &--dark {
            background-color: $dark;
        }
    }

    &__count {
        text-align: center;

        border: 1px solid white;
        border-radius: 5px;

        padding: 3px;

        margin-left: 20px;

        cursor: default;

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

    &__text {
        font-size: $font-base;
        @include breakpoint(tablet) { 
            font-size: $font-lg;
        }
        @include breakpoint(laptop) { 
            font-size: $font-xl;
        }
        @include breakpoint(desktop) { 
            font-size: $font-xxl;
        }
        text-transform: uppercase;
        position: relative;
    }

    @include mode-border;

    &__expand {
        font-size: $font-base;
        @include breakpoint(tablet) { 
            font-size: $font-lg;
        }
        @include breakpoint(laptop) { 
            font-size: $font-xl;
        }
        @include breakpoint(desktop) { 
            font-size: $font-xxl;
        }

        width: 100%;
        padding: 25px;

        text-align: center;

        &--light {
            background-color: white;
        }
        &--dark {
            background-color: $dark;
        }

        display: flex;
        align-items: center;
        flex-direction: column;
    }
}

.collapsible__scroll {
    height: 350px;
    top: 16%;
}
</style>
