<template>
    <div class="index">
        <video 
            autoplay
            muted
            loop
            class="index__video"
        >
            <source 
                src="https://cdn.discordapp.com/attachments/461588387854417922/1121109155277721641/output.mp4"
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
                                v-for="round in roundData"
                                :key="round.name"
                                class="index_schedule__group"
                            >
                                <span class="index_schedule__event">{{ round.name }}</span>
                                <span class="index_schedule__line" />
                                <span class="index_schedule__time">{{ round.dates }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
                <!--- MIDDLE: middle-->
                <div class="index_portal__section">
                    <OpenButton>
                        <template #title>
                            {{ $t('open.home.button.qualifiersMappool') }}
                        </template>
                        {{ $t('open.home.button.mappoolDownload') }}
                    </OpenButton>
                    <OpenButton>
                        <div class="index_portal__button--racing" />
                    </OpenButton>         
                </div>
                <!-- RIGHT: register your team-->
                <div class="index_portal__section">
                    <OpenButton>
                        <template #title>
                            {{ $t('open.home.button.register') }}
                        </template>
                        {{ $t('open.home.button.registrationsEnd') }} July 30 23:59 0UTC
                    </OpenButton>
                    <div class="index_portal__text-content">
                        {{ $t('open.home.presentedBy') }}
                        <hr class="line--red line--no-space">
                        <div class="index_portal__image index_portal__image--row">
                            <img src="../../Assets/img/partners/momokai.png">
                            <img src="../../Assets/img/corsace-full.png">
                        </div>
                    </div>                
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";

import { UserInfo } from "../../Interfaces/user";

import OpenButton from "../../Assets/components/open/OpenButton.vue";

@Component({
    components: {
        OpenButton,
    },
    head () {
        return {
            title: "Corsace Open",
        };
    },
})
export default class Default extends Vue {

    @State loggedInUser!: UserInfo;

    roundData = [
        { name: "REGISTRATION", dates: "NOW - July 30" },
        { name: "QUALIFIERS", dates: "August 5 - 6" },
        { name: "ROUND ROBIN", dates: "August 12 - 13" },
        { name: "ROUND OF 32", dates: "August 19 - 20" },
        { name: "KNOCKOUT 1", dates: "August 26 - 27" },
        { name: "KNOCKOUT 2", dates: "September 2 - 3"},
    ];

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

        &__button {
            &--racing {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 100%;
                background: url('https://i.imgur.com/vwahC3E.png');
                background-repeat: no-repeat;
            }
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