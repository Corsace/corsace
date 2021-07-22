<template>
    <div class="ayim-wrapper">
        <mode-switcher
            v-if="mca"
            hide-phase
            tablet
            stretch
            :ignore-modes="['storyboard']"
        >
            <template #title>
                <div class="ayim-nav">
                    <nuxt-link
                        :to="`/${mca.year}/mapsets/records`"
                        class="ayim-nav__item button"
                        :class="getNavClass('mapsets')"
                    >
                        {{ $t('ayim.mapsets.name') }}
                    </nuxt-link>
                    <nuxt-link
                        :to="`/${mca.year}/mappers/records`"
                        class="ayim-nav__item button"
                        :class="getNavClass('mappers')"
                    >
                        {{ $t('ayim.mappers.name') }}
                    </nuxt-link>
                    <nuxt-link
                        v-if="mca.year !== 2020"
                        :to="`/${mca.year}/comments`"
                        class="ayim-nav__item button"
                        :class="getNavClass('comments')"
                    >
                        {{ $t('ayim.comments.name') }}
                    </nuxt-link>
                </div>
            </template>

            <div class="ayim-content">
                <div
                    v-if="includeSubnav"
                    class="ayim-record-nav"
                >
                    <div class="ayim-record-nav__title">
                        {{ $t(`ayim.${navTitle}.name`) }}
                    </div>
                    <nuxt-link
                        :to="`/${mca.year}/${routeType}/records`"
                        class="ayim-record-nav__item"
                        :class="getSubnavClass('records')"
                    >
                        {{ $t('ayim.main.records') }}
                    </nuxt-link>
                    <nuxt-link
                        :to="`/${mca.year}/${routeType}/statistics`"
                        class="ayim-record-nav__item"
                        :class="getSubnavClass('statistics')"
                    >
                        {{ $t('ayim.main.statistics') }}
                    </nuxt-link>
                </div>
                <slot
                    v-else
                    name="sub-nav"
                />
            
                <div class="ayim-layout-container">
                    <div class="ayim-layout-scroller">
                        <slot />
                        <scroll-bar
                            selector=".ayim-layout"
                            @bottom="$emit('scroll-bottom')"
                        />
                    </div>
                </div>
            </div>
        </mode-switcher>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { State } from "vuex-class";

import ModeSwitcher from "../../MCA-AYIM/components/ModeSwitcher.vue";
import ScrollBar from "../../MCA-AYIM/components/ScrollBar.vue";

import { MCA } from "../../Interfaces/mca";

@Component({
    components: {
        ModeSwitcher,
        ScrollBar,
    },
})
export default class DisplayLayout extends Vue {

    @Prop({ type: String, default: "" }) readonly navTitle!: string;
    @Prop({ type: Boolean, default: true }) readonly includeSubnav!: boolean;

    @State selectedMode!: string;
    @State mca!: MCA;

    get routeType (): string {
        return this.$route.name?.includes("mapsets") ? "mapsets" : "mappers";
    }

    getNavClass (routeName: string): string {
        if (this.$route.name?.includes(routeName))
            return `button--active button--${this.selectedMode}`;

        return "";
    }

    getSubnavClass (routeName: string): string {
        if (!this.$route.name?.includes(routeName))
            return `ayim-record-nav__item--inactive`;

        return "";
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.ayim-record-nav {
    @extend %flex-box;
    justify-content: space-between;
    margin: 0 0 15px 0;
    text-transform: uppercase;
    padding-top: 10px;
    padding-bottom: 10px;
    font-size: $font-lg;
    flex-wrap: wrap;

    @include breakpoint(mobile) {
        flex-direction: column;
    }

    &__title {
        flex: 2;
        @include breakpoint(mobile) {
            display: none;
        }
    }

    &__item {
        flex: 3;

        &--inactive {
            color: $inactive;
            
            @include transition('color');

            &:hover {
                color: white;
            }
        }
    }
}

.ayim-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    position: relative;
}

.ayim-layout-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
}

.ayim-layout {
    display: flex;
    flex-wrap: wrap;
    height: 100%;
    margin-right: 50px;
    position: relative;
    overflow-y: scroll;
    gap: 5px;
    scrollbar-width: none;

    mask-image: linear-gradient(to top, transparent 0%, black 25%);
    
    &__item {
        width: 100%;

        @include breakpoint(tablet) {
            width: calc(33.3% - 10px);
        }
    }

    // Scroll stuff
    &-scroller {
        height: 100%;
        position: relative;
        display: flex;
        flex: 1;
    }

    &::-webkit-scrollbar {
        display: none;
    }
}

.ayim-text {
    @extend %text-wrap;
    text-shadow: $text-shadow;

    &--lg {
        font-size: $font-lg;
        text-shadow: $text-shadow;
        @include breakpoint(mobile) {
            font-size: $font-base;
        }
    }

    &--xl {
        font-size: $font-xl;
        text-shadow: $text-shadow-lg;
        font-weight: 500;
        @include breakpoint(mobile) {
            font-size: $font-lg;
        }
    }

    &--xxl {
        font-size: $font-xxl;
        text-shadow: $text-shadow-lg;
        font-weight: 500;
        @include breakpoint(mobile) {
            font-size: $font-xl;
        }
    }

    &--italic {
        font-style: italic;
    }
}
</style>
