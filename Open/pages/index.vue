<template>
    <div class="index">
        <div class="video-wrapper">
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
            <div class="content">
                <div class="banner">
                    <img src="../../Assets/img/site/open/banner.png">
                    <div class="banner-text">
                        osu!standard 4v4 tournament featuring the lorem ipsums and lorem ipsums 
                    </div>
                </div>
                <div class="portal">
                    <div class="portal-section">
                        <div class="portal-schedule">
                            <div class="portal-schedule-xl">
                                TIMELINE
                            </div>
                            <hr class="red-nospace">
                            <ul class="portal-schedule-content">
                                <li class="portal-schedule-group">
                                    <span class="portal-schedule-event">REGISTRATION</span>
                                    <span class="portal-schedule-time">NOW - July 30</span>
                                </li>
                                <li class="portal-schedule-group">
                                    <span class="portal-schedule-event">QUALIFIERS</span>
                                    <span class="portal-schedule-time">August 5 - 6</span>
                                </li>

                                <li class="portal-schedule-group">
                                    <span class="portal-schedule-event">ROUND ROBIN</span>
                                    <span class="portal-schedule-time">August 12 - 13</span>
                                </li>
                                <li class="portal-schedule-group">
                                    <span class="portal-schedule-event">ROUND OF 32</span>
                                    <span class="portal-schedule-time">August 19 - 20</span>
                                </li>
                                <li class="portal-schedule-group">
                                    <span class="portal-schedule-event">KNOCKOUT 1</span>
                                    <span class="portal-schedule-time">August 26 - 27</span>
                                </li>
                                <li class="portal-schedule-group">
                                    <span class="portal-schedule-event">KNOCKOUT 2</span>
                                    <span class="portal-schedule-time">September 2-3</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <!--- MIDDLE: middle-->
                    <div class="portal-section">
                        <OpenButton>
                            <template #title>
                                QUALIFIERS MAPPOOL
                            </template>
                            Mappool download and statistics
                        </OpenButton>
                        <div class="portal-button-racing" />               
                    </div>
                    <!-- RIGHT: register your team-->
                    <div class="portal-section">
                        <OpenButton>
                            <template #title>
                                REGISTER YOUR TEAM
                            </template>
                            Registrations end July 30 23:59 0UTC
                        </OpenButton>
                        <div class="portal-text-content">
                            CORSACE OPEN 23 IS PRESENTED BY 
                            <hr class="red-nospace">
                            <div class="portal-image-row">
                                <img src="../../Assets/img/partners/momokai.png">
                                <img src="../../Assets/img/corsace-full.png">
                            </div>
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

.index {
    height: 100%;
    width: 100%;
    background: $dark;
}

.video {
    position: absolute;
    top: 0;
    left: 0;
    object-fit: cover;
    height: 100%;
    width: 100%;
    mask-image: linear-gradient(180deg, rgba(19,19,19,1) 0%, rgba(19,19,19,0.75) 5%, rgba(19,19,19,0.5) 10%, rgba(19,19,19,0.25) 20%, rgba(19,19,19,0) 55%);
}

.video-wrapper {
    position: relative;
    overflow: hidden;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}
.content {
    position: relative;
    display: flex;
    flex-direction: column;
}
.banner {
    display: flex;
    align-self: center;
    flex-direction: column;
    margin-top: 50px;
}

.banner-text {
    margin-top: 50px;
}

.portal {
    margin-top: 100px;
    width: 80vw;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

hr.red {
    border: 1px solid $open-red;
    box-shadow: 0px 4px 4px 0px #00000040;
}

hr.red-nospace {
    border: 1px solid $open-red;
    box-shadow: 0px 4px 4px 0px #00000040;
    margin: 0;
}
.portal-section {
    width: 25vw;
}

.portal-schedule {
    margin: 30px 0px;
    text-align: start;
    width: 75%;
}

.portal-schedule-xl {
    color: #EBEBEB;
    padding: 5px 0px;
    text-align: start;
    font-size: $font-xl;
    font-weight: bold;
}

ul.portal-schedule-content {
    color: #EBEBEB;
    width: auto;
    list-style: none;
    padding: 0;
    overflow: hidden;
    margin: 5px 0;
}

ul.portal-schedule-content li:before {
    float: left;
    color: #696969;
    width: 0;
    white-space: nowrap;
    content:
 ". . . . . . . . . . . . . . . . . . . . "
 ". . . . . . . . . . . . . . . . . . . . "
 ". . . . . . . . . . . . . . . . . . . . "
 ". . . . . . . . . . . . . . . . . . . . "
}

.portal-schedule-group {
    padding: 20px 0px;
}

.portal-schedule-event {
    background: $dark;
    padding-right: 0.2em;
    float: left;
}

.portal-schedule-time {
    background: $dark;
    padding-left: 0.2em;
    float: right;
    overflow: hidden;
}

.portal-button-racing {
    margin: 50px 0px;
    background: url('https://i.imgur.com/vwahC3E.png');
    background-repeat: no-repeat;
    border-radius: 9px;
    border: 1px solid;
    min-height: 110px;
    border-color: #EBEBEB;
    box-shadow: 0px 4px 4px 0px #00000040;

}

.portal-image-row {
    display: flex;
    justify-content: space-between;
    padding: 25px 50px;
}
</style>