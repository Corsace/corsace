<template>
    <div class="popupBody notificationsBody">
        <div class="mainButtons">
            <router-link to="/team">
                <div class="mainButton">
                    <img src="../../../Assets/img/open/team.png">
                    {{ $t('open.header.viewTeam') }}
                </div>
            </router-link>
            <div class="mainButton demerits">
                <div class="userDemeritsNumber"> {{ user.pickemPoints }} </div>
                <div class="userDemeritsHeader">PICKEM POINTS</div>
            </div>
            <div class="mainButton" @click="delink">
                <img src="../../../Assets/img/open/link.png">
                {{ $t('open.header.unlink') }}
            </div>
            <div class="mainButton" @click="logout">
                <img src="../../../Assets/img/open/logout.png">
                {{ $t('open.header.logout') }}
            </div>
        </div>
        <img src="../../../Assets/img/open/line.png">
        <div v-if="notifications.length !== 0">
            <div v-for="(notification, i) in notifications" :key="i">
                <div class="inviteWrapper">
                    <div class="inviteHeader">{{ $t('open.header.pending') }}</div>
                    <div class="inviteTeam">{{ notification.team.name.toUpperCase() }}</div>
                    <div class="inviteButtons">
                        <div class="acceptButton" @click="acceptInvite(notification.team.id)"></div>
                        <div class="rejectButton" @click="declineInvite(notification.team.id)"></div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="noInvites">
            {{ $t('open.header.noInv') }}
        </div>
    </div>
</template>

<script>
import axios from "axios";

export default {
    props: {
        notifications: Array,
        user: Object,
        team: Object,
    },
    methods: {
        acceptInvite: function(team) {
            axios.get("/api/user/pendingInvites/accept?team=" + team).then(result => {
                if (result.data.error !== "false") {
                    this.$emit("refresh")
                    this.$emit("notification-toggle")
                }
            }, err => {
                if(err.response.data.error === "TOO_MANY_GUILDS")
                    alert("Joining our Discord server is mandatory, and you have reached the maximum amount of Discord servers on your account. Please leave one and try again!");
                else
                    alert(err.response.data.error +  + " Try joining the discord server first, and then try again. Contact ThePooN or VINXIS if you still can't accept the invite.")
            });
        },
        declineInvite: function(team) {
            axios.get("/api/user/pendingInvites/decline?team=" + team).then(result => {
                if (result.data.error !== "false") {
                    this.$emit("refresh")
                }
            });
        },
        logout: function() {
            axios.get("/api/auth/logout").then(result => {
                this.$emit("refresh")
                this.$emit("notification-toggle")
            });
        },
        delink: function() {
            if(confirm(this.$i18n.messages[this.$i18n.locale].header.unlinkPopup)) {
                if (this.user.team) {
                    if (this.user.id === this.user.team.captain) {
                        axios.get("/api/team/destroy").then(result => {
                            this.delinker();
                        });
                    }
                    else {
                        axios.get("/api/team/leave").then(result => {
                            this.delinker();
                        });
                    }
                }
                else {
                    this.delinker();
                }
            }
        },
        delinker: function() {
            axios.get("/api/auth/osu/delink").then(result => {
                this.$emit("refresh")
                this.$emit("notification-toggle")
            });
        }
    }
}
</script>

<style>
.notificationsBody {
    padding: 10px 15px;
    height: auto;
}

.mainButtons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-row-gap: 15px;
}

.mainButton {
    font-size: 18px;
    align-self: center;
    color: #c8cfd5;
    display: flex;
    cursor: pointer;
    align-items: center;
}

.demerits {
    cursor: initial;
}

.mainButton img, .userDemeritsNumber {
    margin-right: 10px;
}

.userDemeritsNumber, .userDemeritsHeader {
    color: #b64c4c;
    font-weight: bold;
}

.userDemeritsNumber {
    font-size: 24px;
}

.userDemeritsHeader {
    font-size: 11px;
    margin-left: 8px;
}

.inviteWrapper {
    display: grid;
    grid-template-rows: repeat(2, 1fr);
    align-items: center;
}

.inviteHeader {
    font-size: 14px;
    color: #c8cfd5;
    align-self: end;
}

.inviteTeam {
    font-size: 24px;
    color: #b64c4c;
    font-weight: bold;
    grid-row: 2/3;
}

.inviteButtons {
    position: relative;
    display: flex;
    grid-row: 2/3;
    justify-content: space-evenly;
}

.noInvites {
    text-align: center;
    font-style: italic;
}

.badgeIntake {
    font-size: 15px;
    display: flex;
}

@media (max-width: 1322px) {
    .notificationsBody {
        right: 0;
    }       
}
</style>
