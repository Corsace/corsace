<template>
    <div>
        <a 
            class="section-info"
            href="https://shop.corsace.io"
            target="_blank"
        >   
            <div class="section-info__overlay">
                <div class="announcement">
                    <div class="announcement__url">shop.corsace.io</div>
                    <div>{{ $t('main.merch.official') }}</div>
                    <div>{{ $t('main.merch.avail') }}</div>
                </div>
                <div class="announcement__info">
                    <div class="announcement__info--bold">{{ $t('main.merch.name') }}</div>
                    <div>{{ $t('main.merch.colours') }}</div>
                    <div class="announcement__info--cost">€24.99</div>
                </div>
            </div>
        </a>

        <div class="section-events">
            <h2 
                class="events-title"
                :class="`events-title--${viewTheme}`"
            >
                CORSACE EVENTS
            </h2>

            <div class="events">
                <a
                    v-for="(event, key) in events"
                    :key="key"
                    class="event"
                    :href="event.url"
                    target="_blank"
                >
                    <div class="event__image-container">
                        <img
                            class="event__image"
                            :src="require(`../../Assets/img/site/main/${key}.jpg`)"
                            alt=""
                        >
                    </div>
                    <div class="event__title">
                        {{ event.title }}
                    </div>
                </a>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

@Component({
    head () {
        return {
            title: "Corsace",
            meta: [
                { hid: "description", name: "description", content: "Corsace is a series of projects (primarily osu!-related) led by VINXIS which consists of tournaments, events, projects, and many more!" },
                { hid: "og:title", property: "og:title", content: "Corsace" },
                { hid: "og:type", property: "og:type", content: "website" },
                { hid: "og:url", property: "og:url", content: "https://corsace.io" },
                { hid: "og:description", property: "og:description", content: "Corsace is a series of projects (primarily osu!-related) led by VINXIS which consists of tournaments, events, projects, and many more!" },
                { hid: "og:site_name", property: "og:site_name", content: "Corsace" },
                { hid: "theme-color", name: "theme-color", content: "#e98792" },
            ],
        };
    },
})
export default class Default extends Vue {

    @State viewTheme!: "light" | "dark";

    events = {
        "ayim": {
            title: "A YEAR IN MAPPING",
            url: "https://ayim.corsace.io",
        },
        "mca": {
            title: "MAPPERS' CHOICE AWARDS",
            url: "https://mca.corsace.io",
        },
        "open": {
            title: "CORSACE OPEN",
            url: "https://open.corsace.io",
        },
        "closed": {
            title: "CORSACE CLOSED",
            url: "https://osu.ppy.sh/community/forums/topics/1324620",
        },
    };
    
}
</script>

<style lang="scss">
@import '@s-sass/_mixins';
@import '@s-sass/_variables';

@keyframes leftscroll {
    from {
        transform: translateX(0%);
    }
    to {
        transform: translateX(100%);
    }
}

.section-info {
    height: 100%;
    max-height: 45vh;
    @include breakpoint(mobile) {
        height: 50vh;
        max-height: unset;
    }
    
    display: flex;
    align-items: flex-end;
    justify-content: center;
    flex-direction: column;

    background-repeat: no-repeat;
    background-size: 69% 170%, auto;
    background-position: -8vw 32%, center;
    background-image: url('../../Assets/img/site/main/shirts/combined.png'), $dark-cyan;

    @include breakpoint(mobile) {
        background-size: contain;
        background-position: center;
    }

    &__overlay {
        height: 100%;
        width: 100%;

        padding: 5px;

        display: flex;
        align-items: flex-end;
        justify-content: center;
        flex-direction: column;
        @include breakpoint(mobile) {
            flex-direction: row;
        }

        & > div {
            height: 100%;
            width: 45vw;  
        }
    }

    &:hover {
        text-decoration: none;
    }
}

.announcement {
    display: flex;
    flex-direction: column;
    justify-content: end;
    align-items: end;

    margin-right: 1vw;

    font-size: 2vw;

    &__url {
        font-family: 'CocoGoose Pro', 'sans-serif';
        font-size: 4vw;
        line-height: 4vw;
    }

    &__info {
        margin-left: 1vw;

        position: relative;

        display: flex;
        flex-direction: column;
        justify-content: center;

        font-size: 2vw;
        @include breakpoint(laptop) {
            font-size: 1vw;
        }

        @include breakpoint(mobile) {
            justify-content: end;
        }

        &--bold {
            font-weight: bold;
        }

        &--cost {
            position: absolute;
            left: 35%;

            font-size: 2.5vw;
            font-weight: bold;

            @include breakpoint(laptop) {
                font-size: 2vw;
                height: 1vw;
            }
            
            @include breakpoint(mobile) {
                position: unset;
                height: unset;
            }
        }
    }
}

.info-container {
    width: 100%;
    height: 100%;
    background-color: $darker-gray;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px;
}

.info-warning {
    color: $pink;
    background-color: $dark;
    border-radius: 20px;
    padding: 10px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    font-style: italic;
    overflow: hidden;
    white-space: nowrap;

    width: 80%;

    &__lines {
        max-height: 15px;
        margin: 0 10px;
    }

    &__group {
        display: flex;
        align-items: center;
        justify-content: center;

        position: relative;

        animation: leftscroll 8s infinite linear;
    }
}

.info-message {
    text-align: center;
}

.section-events {
    display: flex;
    flex-direction: column;
    padding: 20px 2%;
    margin: auto 0;
}

.events-title {
    text-transform: uppercase;
    border-bottom-color: $pink;
    border-bottom-style: solid;
    border-bottom-width: 1px;
    &--light {
        color: black;
    }
    &--dark {
        color: white;
    }
    @include transition;
}

.events {
    margin-top: 30px;
    margin-bottom: 30px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-around;
}

.event {
    background-color: $dark;
    height: 180px;
    min-width: 300px;
    width: 20%;
    display: flex;
    flex-direction: column;
    border-radius: 10px;
    margin-bottom: 10px;
    margin-right: 10px;

    &__image {
        &-container {
            width: 100%;
            height: 100%;
            overflow: hidden;
        }

        width: 100%;
        height: 100%;
        object-fit: cover;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
    }

    &__title {
        border-top: 1px solid $pink;
        text-transform: uppercase;
        padding: 10px 10px 2em 10px;
    }
}
</style>
