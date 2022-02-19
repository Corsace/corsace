<template>
    <div>
        <div 
            class="index scroll__mca"
            :class="[
                `index--${viewTheme}`,
                `scroll--${viewTheme}`
            ]"
        >
            <a
                href="https://ayim.corsace.io" 
                class="portal__ayim"
            >
                <div :class="`portal__ayim--container portal--${viewTheme}`">
                    <div 
                        class="portal__ayim--offset"
                        :class="`index--${viewTheme}`"
                    >
                        LET'S LOOK BACK AT 2021
                    </div>
                    <div class="portal__ayim--centre">
                        <img
                            :src="require(`../../../Assets/img/site/mca-ayim/year/${$route.params.year}-${viewTheme}-ayim.png`)" 
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
                        OFFICIAL MERCHANDISE STORE
                    </div>
                </a>
            </div>
            <div class="welcomeBack">
                <div>
                    WELCOME TO MCA
                </div>
                <div>
                    USUAL WELCOME BACK TO MCA
                </div>
                <div>
                    USUAL WELCOME BACK TO MCA
                </div>
                <div>
                    USUAL WELCOME BACK TO MCA
                </div>
                <div>
                    USUAL WELCOME BACK TO MCA
                </div>
                <div>
                    USUAL WELCOME BACK TO MCA
                </div>
                <div>
                    USUAL WELCOME BACK TO MCA
                </div>
                <div>
                    USUAL WELCOME BACK TO MCA
                </div>
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
            title: `Mappers' Choice Awards ${this.$route.params.year ?? (new Date()).getUTCFullYear()}`,
            meta: [
                { hid: "description", name: "description", content: "Mappers' Choice Awards is the osu!-related awards event for ranked mappers and members of the mapping community to decide what the beatmaps and who the best users were each year." },
                { hid: "og:title", property: "og:title", content: `Mappers' Choice Awards ${this.$route.params.year ?? (new Date()).getUTCFullYear()}` },
                { hid: "og:type", property: "og:type", content: "website" },
                { hid: "og:url", property: "og:url", content: "https://mca.corsace.io" },
                { hid: "og:description", property: "og:description", content: "Mappers' Choice Awards is the osu!-related awards event for ranked mappers and members of the mapping community to decide what the beatmaps and who the best users were each year." },
                { hid: "og:site_name", property: "og:site_name", content: "MCA" },
                { hid: "theme-color", name: "theme-color", content: "#fb2475" },
            ],
        };
    },
})
export default class Index extends Vue {

    @mcaAyimModule.State mca!: MCA;
    @mcaAyimModule.State selectedMode!: string;

    @State viewTheme!: "light" | "dark";

    dateInfo = Intl.DateTimeFormat().resolvedOptions();
    options: Intl.DateTimeFormatOptions = { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, timeZoneName: "short", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" };

}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

.index {
    background-image: url("../../../Assets/img/site/mca-ayim/home-bg.png");
    background-attachment: local;

    display: flex;
    align-items: center;
    flex-direction: column;

    font-size: $font-title;
    &--light {
        color: black;
    }
    &--dark {
        color: white;
    }

    height: 100%;
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
        margin: 100px 0;
        padding: 0 25px;

        &:hover {
            text-decoration: none;
        }

        &--container {
            display: flex;
            align-items: center;
            justify-content: center;

            position: relative; 
        }

        &--offset {
            position: absolute;
            left: calc(-1 * $font-title/2);

            width: 12rem;
            line-height: 2.5rem;
            letter-spacing: 3px;

            font-weight: bold;
            font-style: italic;
        }

        &--centre {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;

            padding: 15px 0;

            & > img {
                height: 70px;
                margin: 25px 0;
            }
        }
    }

    &__desc {
        font-size: $font-lg;
        font-weight: bold;
    }

    &__link {
        font-family: "CocoGoose Pro", 'sans-serif';
        line-height: $font-title;
    }

    &__other {
        display: flex;
        justify-content: center;
        align-items: center;

        width: 75vw;
        padding-bottom: 100px;
        & a {

            flex: 1;
            margin: 0 25px;
            padding: 15px 45px;

            &:hover {
                text-decoration: none;
            }
        }
    }
}

.welcomeBack {
    font-weight: bold;
}

</style>