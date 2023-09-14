<template>
    <div 
        v-if="mca"
        class="ayim-wrapper"
        hide-phase
        tablet
        stretch
        :ignore-modes="['storyboard']"
    >
        <div class="ayim-nav">
            <nuxt-link
                :to="`/${mca.year}/mapsets/records`"
                class="ayim-nav__item button"
                :class="[
                    getNavClass('mapsets'),
                    `button--${viewTheme}`,
                ]"
            >
                {{ $t('ayim.mapsets.name') }}
            </nuxt-link>
            <nuxt-link
                :to="`/${mca.year}/mappers/records`"
                class="ayim-nav__item button"
                :class="[
                    getNavClass('mappers'),
                    `button--${viewTheme}`,
                ]"
            >
                {{ $t('ayim.mappers.name') }}
            </nuxt-link>
            <nuxt-link
                :to="`/${mca.year}/nominators/records`"
                class="ayim-nav__item button"
                :class="[
                    getNavClass('nominators'),
                    `button--${viewTheme}`,
                ]"
            >
                {{ $t('ayim.nominators.name') }}
            </nuxt-link>
            <nuxt-link
                v-if="mca.year < 2020"
                :to="`/${mca.year}/comments`"
                class="ayim-nav__item button"
                :class="[
                    getNavClass('comments'),
                    `button--${viewTheme}`,
                ]"
            >
                {{ $t('ayim.comments.name') }}
            </nuxt-link>
        </div>

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
        
            <div 
                class="ayim-layout-container scroll__ayim"
                :class="`scroll--${viewTheme}`"
            >
                <div class="ayim-layout-scroller">
                    <slot />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import { MCA } from "../../Interfaces/mca";

const mcaAyimModule = namespace("mca-ayim");

@Component({
    components: {
    },
})
export default class DisplayLayout extends Vue {

    @Prop({ type: String, default: "" }) readonly navTitle!: string;
    @Prop({ type: Boolean, default: true }) readonly includeSubnav!: boolean;

    @mcaAyimModule.State selectedMode!: string;
    @mcaAyimModule.State mca!: MCA;
    @State viewTheme!: "light" | "dark";

    scrollPos = 0;
    scrollSize = 1;
    bottom = false;

    mounted () {
        const list = document.querySelector(".ayim-layout-container");
        if (list) {
            list.addEventListener("scroll", this.handleScroll);
        }
    }

    beforeDestroy () {
        const list = document.querySelector(".ayim-layout-container");
        if (list) {
            list.removeEventListener("scroll", this.handleScroll);
        }
    }

    handleScroll = (event: Event) => {
        if (event.target instanceof HTMLElement) {
            this.scrollPos = event.target.scrollTop;
            this.scrollSize = event.target.scrollHeight - event.target.clientHeight; // U know... just in case the window size changes Lol

            const diff = Math.abs(this.scrollSize - this.scrollPos);
            this.emit(diff <= 50);
        }
    };

    emit (currentlyBottom: boolean): void {
        if (currentlyBottom !== this.bottom) {
            this.bottom = currentlyBottom;
            if (currentlyBottom)
                this.$emit("scroll-bottom");
        }
    }

    get routeType (): string {
        return this.$route.name?.includes("mapsets") ? "mapsets" : "mappers";
    }

    getNavClass (routeName: string): string {
        if (this.$route.name?.includes(routeName))
            return `button--active`;

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

.ayim-wrapper {
    padding: 25px;
    height: 100%;
}


.ayim-nav {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 25px;
    padding-bottom: 25px;
}

.ayim-record-nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    text-transform: uppercase;
    padding: 10px;
    margin-bottom: 15px;
    font-size: $font-lg;
    
    background-color: var(--selected-mode);
    border-radius: 10px;

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

            &:hover {
                color: white;
            }
        }
    }
}

.ayim-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
}

.ayim-layout-container {
    height: calc(100% - 55px);
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
}

.ayim-layout {
    display: flex;
    flex-wrap: wrap;
    height: 125%;
    gap: 5px;

    mask-image: linear-gradient(to top, transparent 0%, black 10%);
    
    &__item {
        width: 100%;

        @include breakpoint(tablet) {
            width: calc(33.3% - 10px);
        }
    }
}

.ayim-text {
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
