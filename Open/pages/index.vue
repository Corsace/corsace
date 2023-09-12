<template>
    <div class="index">
        <video 
            autoplay
            muted
            loop
            class="index__video"
        >
            <source 
                src="https://static-assets.corsace.io/open-2023/landing-page-background-video.webm"
                type="video/mp4"
            >
        </video>

        <div class="index__content">
            <div class="index__banner">
                <img src="../../Assets/img/site/open/banner.png">
                <div>{{ $t('open.home.description') }}</div>
            </div>
            <div class="index_portal">
                <div class="index_portal__section">
                    <div class="index_schedule">
                        <div class="index_schedule--xl">
                            {{ $t('open.home.timeline') }}
                        </div>
                        <hr class="line--red line--no-space">
                        <ul class="index_schedule__content">
                            <li 
                                v-if="tournament"
                                class="index_schedule__group"
                            >
                                <span class="index_schedule__event"> {{ $t('open.home.registrations') }} </span>
                                <span class="index_schedule__line" />
                                <span class="index_schedule__time">{{ new Date(tournament.registrations.start || "").toLocaleString('en-US', optionsRange) }} - {{ new Date(tournament.registrations.end || "").toLocaleString('en-US', optionsRange) }}</span>
                            </li>
                            <li 
                                v-for="round in tournament?.stages"
                                :key="round.name"
                                class="index_schedule__group"
                            >
                                <span class="index_schedule__event"> {{ $t(`open.stages.${round.name.toLowerCase()}`) }} </span>
                                <span class="index_schedule__line" />
                                <span class="index_schedule__time">{{ new Date(round.timespan.start || "").toLocaleString('en-US', optionsRange) }} - {{ new Date(round.timespan.end || "").toLocaleString('en-US', optionsRange) }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
                <!--- MIDDLE: middle-->
                <div class="index_portal__section">
                    <OpenButton
                        :link="'/qualifiers'"
                    >
                        <template #title>
                            {{ $t('open.home.button.qualifiersMappool') }}
                        </template>
                        {{ $t('open.home.button.mappoolDownload') }}
                    </OpenButton>
                    <OpenButton 
                        disabled
                    />         
                </div>
                <!-- RIGHT: register your team-->
                <div class="index_portal__section">
                    <OpenButton
                        :link="loggedInUser ? loggedInUser.discord.username ? '/team/create' : '/api/login/discord?site=open&redirect=/team/create' : '/api/login/osu?site=open&redirect=/'"
                        :external="loggedInUser?.discord.username ? false : true"
                    >
                        <template #title>
                            {{ $t('open.home.button.register') }}
                        </template>
                        {{ $t('open.home.button.registrationsEnd') }} {{ new Date(tournament?.registrations.end || "").toLocaleString('en-US', options) }}
                    </OpenButton>
                    <div class="index_portal__text-content">
                        {{ $t('open.home.presentedBy') }}
                        <hr class="line--red line--no-space">
                        <div class="index_portal__image index_portal__image--row">
                            <a 
                                href="http://momokai.com/corsace" 
                                target="_blank"
                            >
                                <img src="../../Assets/img/partners/momokai.png">
                            </a>
                            <a 
                                href="http://corsace.io"
                                target="_blank"
                            >
                                <img src="../../Assets/img/corsace-full.png">
                            </a>
                        </div>
                    </div>                
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, namespace } from "vuex-class";

import { Tournament } from "../../Interfaces/tournament";
import { UserInfo } from "../../Interfaces/user";

import OpenButton from "../../Assets/components/open/OpenButton.vue";

const openModule = namespace("open");

@Component({
    components: {
        OpenButton,
    },
    head () {
        return {
            title: this.$store.state.open.title,
            meta: [
                {hid: "description", name: "description", content: this.$store.state.open.tournament.description},

                {hid: "og:site_name", property: "og:site_name", content: this.$store.state.open.title},
                {hid: "og:title", property: "og:title", content: this.$store.state.open.title},
                {hid: "og:url", property: "og:url", content: `https://open.corsace.io${this.$route.path}`}, 
                {hid: "og:description", property: "og:description", content: `${this.$store.state.open.tournament.description}`},
                {hid: "og:image",property: "og:image", content: require("../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state.open.title},
                {name: "twitter:description", content: this.$store.state.open.tournament.description},
                {name: "twitter:image", content: require("../../Assets/img/site/open/banner.png")},
                {name: "twitter:image:src", content: require("../../Assets/img/site/open/banner.png")},
            ],
            link: [{rel: "canonical", hid: "canonical", href: `https://open.corsace.io`}],
        };
    },
})
export default class Default extends Vue {

    options: Intl.DateTimeFormatOptions = {
        month: "long", // Full month name (e.g., "July")
        day: "numeric", // Day of the month (e.g., "30")
        hour: "2-digit", // Two-digit hour (e.g., "23")
        hour12: false, // 24-hour format hour
        minute: "2-digit", // Two-digit minute (e.g., "59")
        timeZone: "UTC", // Set the time zone to UTC
        timeZoneName: "short", // Abbreviated time zone name (e.g., "UTC")
    };

    optionsRange: Intl.DateTimeFormatOptions = {
        month: "long", // Full month name (e.g., "July")
        day: "numeric", // Day of the month (e.g., "01")
    };

    @openModule.State tournament!: Tournament | null;

    @State loggedInUser!: UserInfo | null;

    get avatarURL (): string  {
        return this.loggedInUser?.osu.avatar || "";
    }

    async mounted () {
        await this.$store.dispatch("setInitialData", "open");
    }
    
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.index {
    background: $dark;
    position: relative;
    overflow: hidden;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;

    font-weight: 600;

    &__video {
        position: absolute;
        top: 0;
        left: 0;
        object-fit: cover;
        height: 100%;
        width: 100%;
        mask-image: linear-gradient(180deg, rgba(19,19,19,1) 0%, rgba(19,19,19,0.75) 5%, rgba(19,19,19,0.5) 10%, rgba(19,19,19,0.25) 20%, rgba(19,19,19,0) 55%);
    }

    &__content {
        position: relative;
        display: flex;
        flex-direction: column;
    }

    &__banner {
        display: flex;
        align-self: center;
        flex-direction: column;
        margin-top: 50px;
        gap: 50px;
    }

    &_portal {
        margin-top: 100px;
        width: 80vw;
        display: flex;
        flex-direction: row;
        justify-content: space-between;

        &__section {
            width: 25vw;
        }

        &__image {
            &--row {
                display: flex;
                justify-content: space-between;
                padding: 25px 50px;
            }

            & img {
                height: 38px;
                width: auto;
            }
        }
    }

    &_schedule {
        margin: 30px 0px;
        text-align: start;
        width: 75%;

        &--xl {
            color: $white;
            padding: 5px 0px;
            text-align: start;
            font-size: $font-xl;
            font-weight: bold;
        }

        &__content {
            padding: 0;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: stretch;
        }

        &__group {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
        }

        &__event {
            text-align: left;
            padding-right: 0.2em;
        }

        &__line {
            flex-grow: 1;
            height: 1rem;
            background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjEiPgogIDxsaW5lIHgxPSIyIiB5MT0iMSIgeDI9IjQiIHkyPSIxIiBzdHlsZT0ic3Ryb2tlOiM2OTY5Njk7IHN0cm9rZS13aWR0aDoxIiAvPgo8L3N2Zz4K");
            background-repeat: repeat-x;
            margin: 0 0.2em;
            background-position: bottom;
        }

        &__time {
            text-align: right;
            white-space: nowrap;
            padding-left: 0.2em;
        }
    }
}
</style>