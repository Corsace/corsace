<template>
    <div class="header">
        <ul class="headerList">
            <li class="headerListPoint"><router-link to="/"><img src="../../../Assets/img/open/logo.png"></router-link></li>
            <li class="headerListPoint"><img src="../../../Assets/img/open/bullet.png"></li>
            <li class="headerListPoint"><router-link to="/">{{ $t('open.header.home') }}</router-link></li>
            <li class="headerListPoint"><img src="../../../Assets/img/open/bullet.png"></li>
            <li class="headerListPoint"><router-link to="/info">{{ $t('open.header.info') }}</router-link></li>
            <li class="headerListPoint"><img src="../../../Assets/img/open/bullet.png"></li>
            <!-- 
                temporarily disabled
            <li v-if="user.isReferee" class="headerListPoint"><router-link to="/referee">REFEREE</router-link></li>
            <li v-if="user.isReferee" class="headerListPoint"><img src="../../../Assets/img/open/bullet.png"></li> -->
            <li class="headerListPoint"><router-link to="/qualifiers">{{ $t('open.header.qualifiers') }}</router-link></li>
            <li class="headerListPoint"><img src="../../../Assets/img/open/bullet.png"></li>
            <li class="headerListPoint"><router-link to="/pickems">PICKEMS</router-link></li>
            <li class="headerListPoint"><img src="../../../Assets/img/open/bullet.png"></li>
            <li class="headerListPoint"><router-link to="/schedule">{{ $t('open.header.schedule') }}</router-link></li>
            <li class="headerListPoint"><img src="../../../Assets/img/open/bullet.png"></li>
            <li class="headerListPoint"><router-link to="/teams">{{ $t('open.header.teams') }}</router-link></li>
            <li class="headerListPoint"><img src="../../../Assets/img/open/bullet.png"></li>
            <li class="headerListPoint"><router-link to="/mappool">{{ $t('open.header.mappool') }}</router-link></li>
            <li class="headerListPoint"><img src="../../../Assets/img/open/bullet.png"></li>
            <li class="headerListPoint"><router-link to="/talent">{{ $t('open.header.talent') }}</router-link></li>
            <li class="headerListPoint"><img src="../../../Assets/img/open/bullet.png"></li>
        </ul>
        <div class="headerRight">

            <div class="registration" v-if="!loggedInUser" @click="showLoginModal = !showLoginModal">
                <div class="login">
                    {{ $t('open.header.login') }}
                </div>
                <div class="register">
                    {{ $t('open.header.register') }}
                </div>

            </div>
            <div class="userInfo" v-if="loggedInUser">
                <div class="userDesc">
                    <a :href="'https://osu.ppy.sh/u/' + loggedInUser.osu.username"><div class="username">{{ loggedInUser.osu.username }}</div></a>
                    <div v-if="!loggedInUser.team" @click="teamRegisteringToggle" class="userTeamName"><router-link to="/team">{{ $t('open.header.noTeam') }}</router-link></div>
                    <div v-if="loggedInUser.team" class="userTeamName"><router-link to="/team">{{ loggedInUser.team.name }}</router-link></div>
                </div>
            </div>
            <div v-if="loggedInUser" class="avatarWrapper" @click="openNotifications">
                <img class="avatar" v-if="loggedInUser.osu.avatar && loggedInUser.osu.avatar !== null" v-bind:src="loggedInUser.osu.avatar">
                <img class="avatar" v-else src="../../../Assets/img/open/defaultDiscordAvatar.png">
                <div class="notification" v-if="!noNotifications"></div>
            </div>
            <Notifications v-if="notificationPanel" @refresh="refresh" @notification-toggle="notificationPanel = false"></Notifications>
            <LocaleChanger></LocaleChanger>
            <img v-if="loggedInUser" class="settings" src="../../../Assets/img/open/settings.png" @click="openNotifications">
        </div>
        <login-modal
            v-if="showLoginModal"
            :site="site"
            @close="toogleLoginModal"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { State, Action } from "vuex-class";

import axios from "axios";
import LocaleChanger from "./LocaleChanger.vue"
import Notifications from "./Notifications.vue"
import LoginModal from "../../../MCA-AYIM/components/header/LoginModal.vue";

import { UserOpenInfo } from "../../../Interfaces/user";

@Component({
    components: {
        LocaleChanger,
        Notifications,
        LoginModal,
    },
})

export default class Header extends Vue {

    @State site!: string;
    @State loggedInUser!: UserOpenInfo;
    @State noNotifications!: boolean;
    @Action refresh

    showLoginModal = false;
    notificationPanel = false;  
    registered = false;

    mounted() {
        console.log(this.loggedInUser)
    }

    get avatarURL (): string  {
        return this.loggedInUser?.osu?.avatar || "";
    }

    toogleLoginModal (): void {
        this.showLoginModal = !this.showLoginModal;
    }

    teamRegisteringToggle (): void {
            this.$emit('team-registering')
    }
    
    openNotifications (): void {
            this.notificationPanel = !this.notificationPanel
    }
    
    notificationPanelClose (): void {
            this.notificationPanel = false
    }
    

}

</script>

<style>
.test {
    height: 50px;
    width: 50px;
    background: white;
}

.header {
    background-image: url(../../../Assets/img/open/bar.png);
    display: grid;
    grid-template-columns:repeat(2, auto);
    margin: 0;
    padding: 15px 0;
    justify-content: center;
    align-items: center;
}

.headerList {
    display: flex;
    list-style-type: none;
    align-items: center;
    padding: 0;
    margin: 0;
}

.headerListPoint {
    margin: 0 14.5px;
    display: flex;
}

.headerRight {
    display: flex;
    padding: 0 15px;
}

a {
    color: white;
    text-decoration: none;
}

a:focus {
    outline: none;
}

.registration {
    display: flex;
    flex-direction: column;
    text-align: right;
}

.login, .register {
    line-height: 1;
}

.login {
    color: #b64c4c;
    font-weight: bold;
}

.login:hover { 
    cursor: pointer;
}

.register:hover {
    cursor: pointer;
}

.userInfo {
    display: grid;
    grid-column-gap: 5px;
    grid-auto-flow: column;
    align-items: center;
}

.username {
    color: #b64c4c;
    font-weight: bold;
    text-align: right;
}

.userTeamName {
    font-style: italic;
    text-align: right;
    white-space: nowrap;
}

.avatarWrapper {
    position: relative;
    cursor: pointer;
    padding: 0 15px;
}

.avatar {
    height: 30px;
    width: 30px;
}

.notification, .acceptButton, .rejectButton{
    position: absolute;
    cursor: pointer;
    top: -5px;
    right: -5px;
    width: 10px;
    height: 10px;
    background-color: #ff4848;
    border-radius: 5px;
}

.notification, .rejectButton {
    background-color: #ff4848;
}

.acceptButton, .rejectButton {
    top: 0;
    right: 0;
    position: relative;
}

.acceptButton {
    background-color: #5ec949;
}

.settings {
    cursor: pointer;
    align-self: center;
}
</style>
