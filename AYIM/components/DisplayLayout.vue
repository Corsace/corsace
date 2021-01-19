<template>
    <div>
        <mode-switcher :hide-phase="true">
            <template #title>
                <div class="ayim-nav">
                    <button
                        class="ayim-nav__item button"
                        :class="getNavClass('mapsets')"
                    >
                        mapsets
                    </button>
                    <button
                        class="ayim-nav__item button"
                        :class="getNavClass('mappers')"
                    >
                        mappers
                    </button>
                    <button
                        class="ayim-nav__item button"
                        :class="getNavClass('comments')"
                    >
                        comments
                    </button>
                </div>
            </template>

            <div class="ayim-mode-container">
                <div class="ayim-record-nav">
                    <div class="ayim-record-nav__title">
                        {{ navTitle }}
                    </div>
                    <nuxt-link
                        :to="`/${year}/mapsets/records`"
                        class="ayim-record-nav__item"
                        :class="getSubnavClass('records')"
                    >
                        records
                    </nuxt-link>
                    <nuxt-link
                        :to="`/${year}/mapsets/statistics`"
                        class="ayim-record-nav__item"
                        :class="getSubnavClass('statistics')"
                    >
                        statistics
                    </nuxt-link>
                </div>

                <div class="ayim-layout-scroller">
                    <div class="ayim-layout">
                        <slot />
                    </div>
                    <scroll-bar selector=".ayim-layout" />
                </div>
            </div>
        </mode-switcher>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { Action, State } from "vuex-class";

import ModeSwitcher from "../../MCA-AYIM/components/ModeSwitcher.vue";
import ScrollBar from "../../MCA/components/ScrollBar.vue";

@Component({
    components: {
        ModeSwitcher,
        ScrollBar,
    },
})
export default class DisplayLayout extends Vue {

    @Prop({ type: String, required: true }) readonly navTitle!: string;

    @State selectedMode!: string;
    @State year!: number;
    @Action updateYear;

    mounted () {
        const routeYear = parseInt(this.$route.params.year);

        if (!isNaN(routeYear) && this.year !== routeYear) {
            this.updateYear(routeYear);
        }
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

.ayim-nav {
    display: flex;
    justify-content: space-around;
    
    &__item {
        margin-left: 15px;
        margin-right: 15px;
    }
}

.ayim-mode-container {
    padding-right: 25px;
}

.ayim-record-nav {
    @extend %flex-box;
    justify-content: space-between;
    text-transform: uppercase;
    padding-top: 10px;
    padding-bottom: 10px;
    font-size: $font-lg;
    flex-wrap: wrap;

    &__title {
        flex: 2;
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

.ayim-layout {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    
    &__item {
        width: 100%;
        margin: 5px;

        @include breakpoint(tablet) {
            width: calc(33.3% - 10px);
        }
    }

    // Scroll stuff
    &-scroller {
        height: 100%;
        position: relative;
    }

    height: 100vh;
    padding-right: 40px;
    position: relative;
    overflow-y: scroll;
    
    @include breakpoint(tablet) {
        height: 60vh;
    }

    &::-webkit-scrollbar {
        display: none;
    }
}

.ayim-text {
    @extend %text-wrap;
    text-shadow: $text-shadow;

    &--lg {
        font-size: $font-xl;
        text-shadow: $text-shadow-lg;
        font-weight: 500;
    }

    &--italic {
        font-style: italic;
    }
}
</style>
