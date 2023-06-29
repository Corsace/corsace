<template>
    <div class="index">
        <video 
            autoplay
            muted
            loop
            class="video"
        >
            <source 
                src="https://cdn.discordapp.com/attachments/461588387854417922/1121109155277721641/output.mp4"
                type="video/mp4"
            >
        </video>

        <div class="index__content">
            <div class="index__banner">
                <img src="../../Assets/img/site/open/banner.png">
                <div>osu!standard 4v4 tournament featuring the lorem ipsums and lorem ipsums</div>
            </div>
            <div class="index_portal">
                <div class="index_portal__section">
                    <div class="index_schedule">
                        <div class="index_schedule--xl">
                            TIMELINE
                        </div>
                        <hr class="line--red line--no-space">
                        <ul class="index_schedule__content">
                            <li class="index_schedule__group">
                                <span class="index_schedule__event">REGISTRATION</span>
                                <span class="index_schedule__time">NOW - July 30</span>
                            </li>
                            <li class="index_schedule__group">
                                <span class="index_schedule__event">QUALIFIERS</span>
                                <span class="index_schedule__time">August 5 - 6</span>
                            </li>

                            <li class="index_schedule__group">
                                <span class="index_schedule__event">ROUND ROBIN</span>
                                <span class="index_schedule__time">August 12 - 13</span>
                            </li>
                            <li class="index_schedule__group">
                                <span class="index_schedule__event">ROUND OF 32</span>
                                <span class="index_schedule__time">August 19 - 20</span>
                            </li>
                            <li class="index_schedule__group">
                                <span class="index_schedule__event">KNOCKOUT 1</span>
                                <span class="index_schedule__time">August 26 - 27</span>
                            </li>
                            <li class="index_schedule__group">
                                <span class="index_schedule__event">KNOCKOUT 2</span>
                                <span class="index_schedule__time">September 2-3</span>
                            </li>
                        </ul>
                    </div>
                </div>
                <!--- MIDDLE: middle-->
                <div class="index_portal__section">
                    <OpenButton>
                        <template #title>
                            QUALIFIERS MAPPOOL
                        </template>
                        Mappool download and statistics
                    </OpenButton>
                    <div class="index_portal__button--racing" />               
                </div>
                <!-- RIGHT: register your team-->
                <div class="index_portal__section">
                    <OpenButton>
                        <template #title>
                            REGISTER YOUR TEAM
                        </template>
                        Registrations end July 30 23:59 0UTC
                    </OpenButton>
                    <div class="index_portal__text-content">
                        CORSACE OPEN 23 IS PRESENTED BY 
                        <hr class="line--red line--no-space">
                        <div class="index_portal__image--row">
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

.video {
    position: absolute;
    top: 0;
    left: 0;
    object-fit: cover;
    height: 100%;
    width: 100%;
    mask-image: linear-gradient(180deg, rgba(19,19,19,1) 0%, rgba(19,19,19,0.75) 5%, rgba(19,19,19,0.5) 10%, rgba(19,19,19,0.25) 20%, rgba(19,19,19,0) 55%);
}

.index {
    background: $dark;
    position: relative;
    overflow: hidden;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;

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
                margin: 50px 0px;
                background: url('https://i.imgur.com/vwahC3E.png');
                background-repeat: no-repeat;
                border-radius: 9px;
                border: 1px solid;
                min-height: 110px;
                border-color: #EBEBEB;
                box-shadow: 0px 4px 4px 0px #00000040;
            }
        }

        &__image {
            &--row {
                display: flex;
                justify-content: space-between;
                padding: 25px 50px;
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
            color: $white;
            width: auto;
            list-style: none;
            padding: 0;
            overflow: hidden;
            margin: 5px 0;

            & li:before {
                float: left;
                color: $gray;
                width: 0;
                white-space: nowrap;
                content:
                ". . . . . . . . . . . . . . . . . . . . "
                ". . . . . . . . . . . . . . . . . . . . "
                ". . . . . . . . . . . . . . . . . . . . "
                ". . . . . . . . . . . . . . . . . . . . "
            }
        }

        &__group {
            padding: 20px 0;
        }

        &__event {
            padding-right: 0.2em;
            float: left;
        }

        &__time {
            padding-left: 0.2em;
            float: right;
            overflow: hidden;
        }
    }
}
</style>