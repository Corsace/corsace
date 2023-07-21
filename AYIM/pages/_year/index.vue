<template>
    <div>
        <div
            v-if="!selectedMode"
            class="index scroll__mca index__bg"
            :class="[
                `index--${viewTheme}`,
                `scroll--${viewTheme}`
            ]"
        >
            <a
                href="https://mca.corsace.io" 
                class="portal__ayim"
            >
                <div :class="`portal__ayim--container portal--${viewTheme}`">
                    <div 
                        class="portal__ayim--offset"
                        :class="`index--${viewTheme}`"
                    >
                        {{ $route.params.year }}'s BEST MAPS
                    </div>
                    <div class="portal__ayim--centre">
                        <img
                            :src="require(`../../../Assets/img/site/mca-ayim/year/${$route.params.year || 2023}-${viewTheme}-mca.png`)" 
                        >
                        <div class="portal__desc">
                            CLICK HERE TO ENTER
                        </div>
                    </div>
                </div>
            </a>
            <div class="portal__other">
                <a 
                    href="https://shop.corsace.io"
                    class="portal__shop"
                    :class="`portal--${viewTheme}`"
                >
                    <div class="portal__link">
                        shop.<span class="bold">corsace</span>.io
                    </div>
                    <div class="portal__desc">
                        OFFICIAL MERCHANDISE STORE
                    </div>
                </a>
                <a 
                    href="https://corsace.io"
                    class="portal__main"
                    :class="`portal--${viewTheme}`"
                >
                    <div class="portal__link">
                        <span class="bold">corsace</span>.io
                    </div>
                    <div class="portal__desc">
                        MAIN EVENT HUB
                    </div>
                </a>
            </div>
            <div class="welcomeBack">
                <div>
                    WELCOME TO AYIM
                </div>
                <div>
                    THE YEARLY RECAP
                </div>
                <div>
                    OF THE RECORDS AND STATS
                </div>
                <div>
                    CREATED BY MAPS AND MAPPERS
                </div>
                <br>
                <div>
                    CLICK ON A MODE TO GET STARTED
                </div>
                <br>
            </div>
        </div>
        <div 
            v-else
            class="index__noMCA index__bg"
            :class="`index--${viewTheme}`"
        >
            <div>
                No MCA currently for {{ $route.params.year }}
            </div>
            <div>
                Click below to navigate between years
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import { MCA } from "../../../Interfaces/mca";

const mcaAyimModule = namespace("mca-ayim");

@Component({
    components: {
    },
    head () {
        return {
            title: `A Year in Mapping ${this.$route.params.year ?? (new Date()).getUTCFullYear()}`,
            meta: [
                { hid: "description", name: "description", content: "A Year in Mapping details the records and statistics from each year for the osu! ranked section." },
                { hid: "og:title", property: "og:title", content: `A Year in Mapping ${this.$route.params.year ?? (new Date()).getUTCFullYear()}` },
                { hid: "og:type", property: "og:type", content: "website" },
                { hid: "og:url", property: "og:url", content: "https://ayim.corsace.io" },
                { hid: "og:description", property: "og:description", content: "A Year in Mapping details the records and statistics from each year for the osu! ranked section." },
                { hid: "og:site_name", property: "og:site_name", content: "AYIM" },
                { hid: "theme-color", name: "theme-color", content: "#fb2475" },
            ],
        };
    },
})
export default class Index extends Vue {
    @mcaAyimModule.State mca!: MCA;
    @mcaAyimModule.State selectedMode!: string;

    @State viewTheme!: "light" | "dark";
    
    currentMode = "";

    async mounted () {
        await this.$store.dispatch("mca-ayim/setSelectedMode");
    }
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.index {
    &__bg {
        background-image: url("../../../Assets/img/site/mca-ayim/home-bg.png");
        background-position: center;
        background-repeat: repeat-y;
        background-attachment: local;
        background-size: 100%;
    }

    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 20px;	
    @include breakpoint(mobile) {	
        margin-top: 55px;	
    }

    font-size: $font-base;
    @include breakpoint(tablet) {
        font-size: $font-xl;
    }
    @include breakpoint(laptop) {
        font-size: $font-xxl;
    }
    @include breakpoint(desktop) {
        font-size: $font-xxxl;
    }
    &--light {
        color: black;
    }
    &--dark {
        color: white;
    }

    height: 100%;

    &__main {
        font-size: $font-sm;	
        @include breakpoint(tablet) { 	
            font-size: $font-base;	
        }	
        @include breakpoint(laptop) { 	
            font-size: $font-lg;	
        }	
        @include breakpoint(desktop) { 	
            font-size: $font-xl;	
        }	
        padding: 20px 50px;
    }

    &__noMCA {
        height: 100%;

        @include breakpoint(mobile) {
            font-size: $font-xl;
        }
        font-size: $font-xxl;
        @include breakpoint(tablet) {
            font-size: $font-xxxl;
        }
        @include breakpoint(desktop) {
            font-size: $font-title;
        }

        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: center;
    }
}

.portal {
    &--light {
        background-color: white;
    }
    &--dark {
        background-color: $dark;
    }
    &--light, &--dark {
        color: $blue;
        border: 1px $blue solid; 
    }

    &__ayim {
        width: 75vw;
        margin: 50px 0;
        @include breakpoint(laptop) {
            margin: 80px 0;
        }
        padding: 0 25px;

        &:hover {
            text-decoration: none;
        }

        &--container {
            display: flex;
            align-items: center;
            justify-content: center;

            position: relative; 

            background-image: url("../../../Assets/img/site/mca-ayim/blue-line.png");
            background-repeat: no-repeat;
            background-position-y: 5%;
            background-position-x: 33%;
        }

        &--offset {
            position: absolute;
            @include breakpoint(mobile) {
                left: 0;
                right: 0;
                top: -3rem;
            }
            left: calc(-1 * $font-title/2);
            
            @include breakpoint(mobile) {
                width: 100%;
            }
            width: calc(4 * $font-xl);
            @include breakpoint(tablet) {
                width: calc(4 * $font-xxl);
            }
            @include breakpoint(laptop) {
                width: calc(4 * $font-xxxl);
            }
            @include breakpoint(desktop) {
                width: calc(4 * $font-title);
            }
            line-height: 2.5rem;
            letter-spacing: 3px;

            font-style: italic;
            font-weight: bold;
        }

        &--centre {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;

            padding: 15px 0;

            & > img {
                @include breakpoint(mobile) {	
                    height: 40px;	
                }
                height: 70px;
                margin: 25px 0;
            }
        }
    }

    &__desc {
        font-size: $font-xsm;
        @include breakpoint(laptop) {
            font-size: $font-sm;
        }
        @include breakpoint(desktop) {
            font-size: $font-base;
        }
        font-weight: bold;
    }

    &__link {
        font-family: "CocoGoose Pro", 'sans-serif';
        font-size: $font-lg;
        line-height: $font-lg;
        @include breakpoint(laptop) {
            font-size: $font-xl;
            line-height: $font-xl;
        }
        @include breakpoint(desktop) {
            font-size: $font-xxxl;
            line-height: $font-xxxl;
        }
    }

    &__other {
        display: flex;
        justify-content: center;
        align-items: center;
        @include breakpoint(mobile) {
            flex-direction: column;
        }

        width: 75vw;
        & a {

            flex: 1;
            @include breakpoint(mobile) {
                margin: 25px 0;
                width: 100%;
            }
            margin: 0 25px;
            padding: 10px 20px;
            @include breakpoint(desktop) {
                padding: 15px 45px;
            }

            &:hover {
                text-decoration: none;
            }
        }
    }
}

.welcomeBack {
    font-weight: bold;
    line-height: $font-xl;
    @include breakpoint(tablet) {
        line-height: $font-xxl;
    }
    @include breakpoint(laptop) {
        line-height: $font-xxxl;
    }
    @include breakpoint(desktop) {
        line-height: $font-title;
    }
}

.nominating {
    text-shadow: -1px -1px 0 $dark, 1px -1px 0 $dark, -1px 1px 0 $dark, 1px 1px 0 $dark;
    color: $yellow;
}

.voting {
    text-shadow: -1px -1px 0 $dark, 1px -1px 0 $dark, -1px 1px 0 $dark, 1px 1px 0 $dark;
    color: $yellow;
}

.preparation {
    text-shadow: -1px -1px 0 $dark, 1px -1px 0 $dark, -1px 1px 0 $dark, 1px 1px 0 $dark;
    color: $red;
}

.results {
    text-shadow: -1px -1px 0 $dark, 1px -1px 0 $dark, -1px 1px 0 $dark, 1px 1px 0 $dark;
    color: $green;
}
</style>